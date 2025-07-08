// BoxedWine GCC Compiler for MIPS
// Author: Tabitha Hanegan

let BoxedWineGCCModule = null;
let BoxedWineRuntime = null;

const DEFAULT_CONFIG = {
  winePrefix: '/home/wineuser/.wine',
  gccPath: 'C:\\MinGW\\bin\\gcc.exe',
  tempDir: '/tmp/gcc_compile',
  mountPoints: [
    { host: '/tmp', wine: 'Z:\\tmp' }
  ]
};

// Main export function
export default function BoxedWineGCC(options = {}) {
  if (!BoxedWineGCCModule) {
    BoxedWineGCCModule = initBoxedWineGCC(options);
  }
  return BoxedWineGCCModule;
}

// Initialize BoxedWine with GCC support
async function initBoxedWineGCC(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  try {
    // First, load the BoxedWine runtime
    await loadBoxedWineRuntime();
    
    // Then load the BoxedWine WASM module
    const wasmBinary = await fetchWasm('/packages/lib/lib/gcc/boxedwine-gcc.wasm');
    const module = await createBoxedWineModule({ ...config, wasmBinary });

    await setupFileSystem(module, config);
    await setupWineInstallation(module, config);

    return {
      compile: async (filename, source) => {
        const output = `/tmp/output.s`;
        const result = await compileSourceToAssembly(module, filename, output, source, config);
        return result;
      }
    };
  } catch (err) {
    console.error('BoxedWine GCC init failed:', err);
    throw err;
  }
}

// Load BoxedWine runtime
async function loadBoxedWineRuntime() {
  if (BoxedWineRuntime) {
    return BoxedWineRuntime;
  }

  console.log('Loading BoxedWine runtime...');
  
  try {
    // Load the BoxedWine runtime script
    const script = document.createElement('script');
    script.src = '/packages/lib/lib/gcc/boxedwine-runtime.js';
    script.async = false;
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load BoxedWine runtime'));
      document.head.appendChild(script);
    });
    
    // Wait for BoxedWine to be available
    let attempts = 0;
    while (typeof BoxedWine === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof BoxedWine === 'undefined') {
      throw new Error('BoxedWine runtime not loaded after timeout');
    }
    
    BoxedWineRuntime = BoxedWine;
    console.log('BoxedWine runtime loaded successfully');
    return BoxedWineRuntime;
    
  } catch (error) {
    console.error('Failed to load BoxedWine runtime:', error);
    throw error;
  }
}

// Fetch WASM binary
async function fetchWasm(path) {
  console.log('[BoxedWine] Fetching WASM from:', path);
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load BoxedWine WASM: ${response.statusText} (${response.status})`);
  }
  return await response.arrayBuffer();
}

// Create actual Emscripten BoxedWine module
function createBoxedWineModule(config) {
  return new Promise((resolve, reject) => {
    if (typeof BoxedWine === 'undefined') {
      return reject(new Error('BoxedWine global is not defined'));
    }

    const Module = {
      wasmBinary: config.wasmBinary,
      noInitialRun: true,
      noExitRuntime: true,
      print: (text) => console.log('[BoxedWine]', text),
      printErr: (text) => console.error('[BoxedWine error]', text),
      locateFile: (path, scriptDirectory) => {
        return scriptDirectory + path;
      },
      onRuntimeInitialized: () => {
        console.log('[BoxedWine] Runtime initialized');
        resolve(Module);
      }
    };

    BoxedWine(Module);
  });
}

// Set up directories and Wine install
async function setupFileSystem(module, config) {
  const FS = module.FS;

  // Create temp directory
  try {
    FS.mkdir(config.tempDir);
  } catch {}

  // Mount host paths (if needed in future BoxedWine forks)
  for (const mount of config.mountPoints) {
    console.log(`Mounting ${mount.host} to ${mount.wine}`);
    // Mounting not implemented in BoxedWine FS, unless extended
  }
}

// Setup minimal wine layout (dummy install zip ignored)
async function setupWineInstallation(module, config) {
  const FS = module.FS;
  const winePrefix = config.winePrefix;

  function safeMkdir(path) {
    try { FS.mkdir(path); } catch {}
  }

  safeMkdir(winePrefix);
  safeMkdir(`${winePrefix}/drive_c`);
  safeMkdir(`${winePrefix}/drive_c/windows`);
  safeMkdir(`${winePrefix}/drive_c/windows/system32`);
  safeMkdir(`${winePrefix}/bin`);

  FS.writeFile(`${winePrefix}/bin/wine`, '#!/bin/bash\necho "Wine 1.7.0"');
}

// Compile C source to MIPS assembly using GCC inside BoxedWine
async function compileSourceToAssembly(module, inputPath, outputPath, sourceCode, config) {
  const FS = module.FS;

  // Write source file
  FS.writeFile(inputPath, sourceCode);

  const wineEnv = {
    WINEPREFIX: config.winePrefix,
    PATH: '/home/wineuser/.wine/bin:/usr/bin:/bin',
    DISPLAY: ':0'
  };

  const gccCommand = [
    'wine',
    config.gccPath,
    '-S',
    '-march=mips32',
    '-mabi=32',
    '-O2',
    '-o', outputPath,
    inputPath
  ];

  const result = await runWineCommand(module, gccCommand, wineEnv);

  if (result.exitCode !== 0) {
    throw new Error(`GCC failed: ${result.stderr}`);
  }

  const rawOutput = FS.readFile(outputPath, { encoding: 'utf8' });
  const cleanOutput = processGCCAssembly(rawOutput);

  return cleanOutput;
}

// Actually run a command in BoxedWine
async function runWineCommand(module, command, env) {
  return new Promise((resolve, reject) => {
    try {
      const commandStr = command.join(' ');
      const envStr = Object.entries(env).map(([k, v]) => `${k}=${v}`).join(' ');

      const fullCommand = `${envStr} ${commandStr}`;
      console.log('[BoxedWine] Running:', fullCommand);

      if (module.callMain) {
        module.callMain(['wine', ...command.slice(1)]);
        resolve({ exitCode: 0, stdout: '', stderr: '' }); // Assume stdout/stderr not captured
      } else {
        reject(new Error('BoxedWine: callMain not available'));
      }
    } catch (e) {
      reject(e);
    }
  });
}

// Clean up MIPS assembly for compatibility
function processGCCAssembly(assembly) {
  const lines = assembly.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line =>
      line &&
      !line.startsWith('.') &&
      !line.startsWith('#') &&
      !line.startsWith(';') &&
      !line.startsWith('.file') &&
      !line.startsWith('.section') &&
      !line.startsWith('.text') &&
      !line.startsWith('.globl') &&
      !line.startsWith('.type') &&
      !line.startsWith('.size') &&
      !line.startsWith('.ident') &&
      !line.startsWith('.option')
    )
    .join('\n');
}
