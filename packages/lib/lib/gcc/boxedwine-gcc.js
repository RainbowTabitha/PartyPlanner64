// BoxedWine GCC Compiler for MIPS
// Author: Tabitha Hanegan

import { WASM_BINARY_ARRAY_BUFFER } from './wasm-data.js';
import JSZip from 'jszip';

let BoxedWineGCCModule = null;

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
    // Use the embedded WASM binary directly
    const wasmBinary = WASM_BINARY_ARRAY_BUFFER;
    
    // Create the BoxedWine module with the WASM binary
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

// Create actual Emscripten BoxedWine module
function createBoxedWineModule(config) {
  return new Promise((resolve, reject) => {
    // Configure the Module before the runtime script loads
    window.Module = {
      wasmBinary: config.wasmBinary,
      noInitialRun: true,
      noExitRuntime: true,
      print: (text) => console.log('[BoxedWine]', text),
      printErr: (text) => console.error('[BoxedWine error]', text),
      locateFile: (path, scriptDirectory) => {
        // Handle file location requests
        if (path === './boxedwine-gcc.wasm') {
          // Return a dummy URL since we're providing the binary directly
          return 'data:application/wasm;base64,';
        }
        return scriptDirectory + path;
      },
      onRuntimeInitialized: () => {
        console.log('[BoxedWine] Runtime initialized, checking for available methods...');
        
        // Log all available methods for debugging
        const availableMethods = Object.keys(window.Module).filter(key => key.startsWith('_'));
        console.log('[BoxedWine] Available methods:', availableMethods);
        
        // Check for basic required methods
        const basicMethods = ['_malloc', '_free', '_main'];
        const missingBasicMethods = basicMethods.filter(method => !window.Module[method]);
        
        if (missingBasicMethods.length > 0) {
          console.error('[BoxedWine] Missing basic required methods:', missingBasicMethods);
          reject(new Error(`BoxedWine module missing basic required methods: ${missingBasicMethods.join(', ')}`));
          return;
        }
        
        // Create fallback implementations for missing helper methods
        if (!window.Module.stringToUTF8) {
          console.log('[BoxedWine] Creating fallback stringToUTF8 method');
          window.Module.stringToUTF8 = function(str, outPtr, maxBytesToWrite) {
            const bytes = new TextEncoder().encode(str);
            const len = Math.min(bytes.length, maxBytesToWrite - 1);
            for (let i = 0; i < len; i++) {
              window.Module.setValue(outPtr + i, bytes[i], 'i8');
            }
            window.Module.setValue(outPtr + len, 0, 'i8'); // null terminator
            return len;
          };
        }
        
        if (!window.Module.setValue) {
          console.log('[BoxedWine] Creating fallback setValue method');
          window.Module.setValue = function(ptr, value, type) {
            const view = new DataView(window.Module.HEAPU8.buffer);
            const offset = ptr;
            
            switch (type) {
              case 'i8':
                view.setInt8(offset, value);
                break;
              case 'i16':
                view.setInt16(offset, value, true);
                break;
              case 'i32':
                view.setInt32(offset, value, true);
                break;
              case 'i64':
                view.setBigInt64(offset, BigInt(value), true);
                break;
              case 'f32':
                view.setFloat32(offset, value, true);
                break;
              case 'f64':
                view.setFloat64(offset, value, true);
                break;
              default:
                throw new Error(`Unknown type: ${type}`);
            }
          };
        }
        
        console.log('[BoxedWine] Module ready with fallback methods');
        resolve(window.Module);
      }
    };

    // Load the BoxedWine runtime script
    const script = document.createElement('script');
    script.src = '/packages/lib/lib/gcc/boxedwine-runtime.js';
    script.async = false;
    
    script.onload = () => {
      console.log('[BoxedWine] Runtime script loaded');
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load BoxedWine runtime script'));
    };
    
    document.head.appendChild(script);
  });
}

// Set up directories and Wine install
async function setupFileSystem(module, config) {
  // Use global FS object, fall back to individual methods if needed
  const createPath = module.FS_createPath || (() => { throw new Error('FS_createPath not available'); });
  const createDataFile = module.FS_createDataFile || (() => { throw new Error('FS_createDataFile not available'); });

  // Create temp directory
  try {
    if (typeof FS !== 'undefined') {
      FS.mkdir(config.tempDir);
    } else {
      createPath('/', config.tempDir.split('/').filter(Boolean), true, true);
    }
  } catch (e) {
    console.log('[BoxedWine] Temp dir creation failed (may already exist):', e);
  }

  // Mount host paths (if needed in future BoxedWine forks)
  for (const mount of config.mountPoints) {
    console.log(`Mounting ${mount.host} to ${mount.wine}`);
    // Mounting not implemented in BoxedWine FS, unless extended
  }
}

// Mount wine-1.7.zip as virtual filesystem
async function setupWineInstallation(module, config) {
  const winePrefix = config.winePrefix;
  const wineZipPath = '/packages/lib/lib/gcc/wine-1.7.zip';

  try {
    console.log('[BoxedWine] Mounting wine-1.7.zip as virtual filesystem...');
    
    // Create the wine prefix directory
    if (typeof FS !== 'undefined') {
      FS.mkdir(winePrefix);
    } else {
      const createPath = module.FS_createPath || (() => { throw new Error('FS_createPath not available'); });
      createPath('/', winePrefix.split('/').filter(Boolean), true, true);
    }

    // Extract the wine zip file contents
    console.log('[BoxedWine] Using JSZip to extract wine zip contents...');
    await extractWineZip(module, wineZipPath, winePrefix);
  } catch (e) {}
}

// Extract wine zip contents using JSZip
async function extractWineZip(module, zipPath, targetPath) {
  try {
    console.log('[BoxedWine] Extracting wine zip contents...');
    
    // Read the zip file
    const response = await fetch(zipPath);
    const zipBuffer = await response.arrayBuffer();
    
    // Load and extract the zip file
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);
    
    // Extract all files from the zip
    for (const [filePath, file] of Object.entries(zipContent.files)) {
      if (!file.dir) {
        try {
          const fileContent = await file.async('uint8array');
          const fullPath = `${targetPath}/${filePath}`;
          
          // Create directory structure if needed
          const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
          if (typeof FS !== 'undefined') {
            try {
              // Create parent directories recursively
              const pathParts = dirPath.split('/').filter(Boolean);
              let currentPath = '';
              for (const part of pathParts) {
                currentPath += '/' + part;
                try {
                  FS.mkdir(currentPath);
                } catch (e) {
                  // Directory might already exist
                }
              }
            } catch (e) {
              // Directory might already exist
            }
          }
          
          // Write the file
          if (typeof FS !== 'undefined') {
            FS.writeFile(fullPath, fileContent);
          } else if (module.FS_createDataFile) {
            const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
            const filename = fullPath.substring(fullPath.lastIndexOf('/') + 1);
            module.FS_createDataFile(dir, filename, fileContent, true, true, true);
          }
        } catch (e) {
          console.log(`[BoxedWine] Failed to extract ${filePath}:`, e);
        }
      }
    }
    
    console.log('[BoxedWine] Wine zip extraction completed');
  } catch (e) {
    console.log('[BoxedWine] Zip extraction failed:', e);
    throw e;
  }
}

// Compile C source to MIPS assembly using GCC inside BoxedWine
async function compileSourceToAssembly(module, inputPath, outputPath, sourceCode, config) {
  const createDataFile = module.FS_createDataFile || (() => { throw new Error('FS_createDataFile not available'); });

  // Write source file
  try {
    if (typeof FS !== 'undefined') {
      FS.writeFile(inputPath, sourceCode);
    } else {
      const dir = inputPath.substring(0, inputPath.lastIndexOf('/'));
      const filename = inputPath.substring(inputPath.lastIndexOf('/') + 1);
      createDataFile(dir, filename, sourceCode, true, true, true);
    }
  } catch (e) {
    console.log('[BoxedWine] Source file creation failed:', e);
    throw e;
  }

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

  // Read output file using available FS methods
  try {
    let rawOutput;
    if (typeof FS !== 'undefined') {
      // Try different methods to read the file
      try {
        // Method 1: Try FS.readFile if available
        if (typeof FS.readFile === 'function') {
          rawOutput = FS.readFile(outputPath, { encoding: 'utf8' });
        }
        // Method 2: Try FS.readFile without encoding option
        else if (typeof FS.readFile === 'function') {
          const buffer = FS.readFile(outputPath);
          rawOutput = new TextDecoder().decode(buffer);
        }
        // Method 3: Try using FS.open and FS.read
        else {
          const fd = FS.open(outputPath, 'r');
          const stats = FS.fstat(fd);
          const buffer = new Uint8Array(stats.size);
          FS.read(fd, buffer, 0, stats.size, 0);
          FS.close(fd);
          rawOutput = new TextDecoder().decode(buffer);
        }
      } catch (fsError) {
        console.log('[BoxedWine] FS.readFile failed, trying alternative methods:', fsError);
        // Fallback: try to get file content through module methods
        if (module.FS_readFile) {
          rawOutput = module.FS_readFile(outputPath, { encoding: 'utf8' });
        } else {
          throw new Error('No available method to read file from BoxedWine filesystem');
        }
      }
    } else {
      // Try module methods
      if (module.FS_readFile) {
        rawOutput = module.FS_readFile(outputPath, { encoding: 'utf8' });
      } else {
        throw new Error('No available method to read file from BoxedWine filesystem');
      }
    }
    
    const cleanOutput = processGCCAssembly(rawOutput);
    return cleanOutput;
  } catch (e) {
    console.log('[BoxedWine] Output file read failed:', e);
    throw e;
  }
}

// Actually run a command in BoxedWine
async function runWineCommand(module, command, env) {
  return new Promise((resolve, reject) => {
    try {
      const commandStr = command.join(' ');
      const envStr = Object.entries(env).map(([k, v]) => `${k}=${v}`).join(' ');

      const fullCommand = `${envStr} ${commandStr}`;
      console.log('[BoxedWine] Running:', fullCommand);

      // Try multiple approaches to run the command
      if (module._main) {
        console.log('[BoxedWine] Using _main method');
        try {
          // Check if we have the required helper methods
          const requiredMethods = ['_malloc', '_free', 'stringToUTF8', 'setValue'];
          const missingMethods = requiredMethods.filter(method => !module[method]);
          
          if (missingMethods.length > 0) {
            console.error('[BoxedWine] Missing required methods:', missingMethods);
            console.log('[BoxedWine] Available methods:', Object.keys(module).filter(key => key.startsWith('_')));
            throw new Error(`Required helper methods (${missingMethods.join(', ')}) not available`);
          }
          
          // Convert command array to C-style argc/argv
          const argc = command.length;
          const argv = module._malloc(argc * 4); // 4 bytes per pointer
          const argvStrings = [];
          
          for (let i = 0; i < argc; i++) {
            const str = module._malloc(command[i].length + 1);
            module.stringToUTF8(command[i], str, command[i].length + 1);
            module.setValue(argv + i * 4, str, 'i32');
            argvStrings.push(str);
          }
          
          console.log('[BoxedWine] Calling _main with argc:', argc, 'argv:', argv);
          const result = module._main(argc, argv);
          console.log('[BoxedWine] _main returned:', result);
          
          // Clean up allocated memory
          argvStrings.forEach(str => module._free(str));
          module._free(argv);
          
          resolve({ exitCode: result, stdout: '', stderr: '' });
        } catch (mainError) {
          console.error('[BoxedWine] _main failed:', mainError);
          reject(mainError);
        }
      } else if (module.callMain) {
        console.log('[BoxedWine] Using callMain method');
        try {
          module.callMain(['wine', ...command.slice(1)]);
          resolve({ exitCode: 0, stdout: '', stderr: '' }); // Assume stdout/stderr not captured
        } catch (callMainError) {
          console.error('[BoxedWine] callMain failed:', callMainError);
          reject(callMainError);
        }
      } else if (typeof module.ccall === 'function') {
        console.log('[BoxedWine] Using ccall method');
        try {
          const result = module.ccall('main', 'number', ['array', 'number'], [command, command.length]);
          resolve({ exitCode: result, stdout: '', stderr: '' });
        } catch (ccallError) {
          console.error('[BoxedWine] ccall failed:', ccallError);
          reject(ccallError);
        }
      } else {
        console.error('[BoxedWine] No available method to run commands');
        console.log('[BoxedWine] Available methods:', Object.keys(module));
        reject(new Error('BoxedWine: No available method to run commands. Available methods: ' + Object.keys(module).join(', ')));
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
