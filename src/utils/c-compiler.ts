import SmallerC, { EmscriptenModule } from "../lib/SmallerC/smlrc";

/**
 * Compiles C source to MIPS assembly.
 * @param source C source code string
 */
export async function compile(source: string): Promise<string> {
  let _smallerCInstance: EmscriptenModule;
  let _smallerCPromiseLike: PromiseLike<EmscriptenModule>;

  let errors: string[] = [];
  const addError = (text: string) => {
    text = text.replace("in \"/input.c\"", ""); // Input file not useful in error messages.
    errors.push(text);
  };

  _smallerCPromiseLike = SmallerC({
    noInitialRun: true,
    locateFile: (path: string, scriptDirectory: string) => {
      if (path === "smlrc.wasm") {
        return "../../smlrc.wasm";
      }
      return scriptDirectory + path; // Same as default in smlrc.js's locateFile
    },
    print: addError,
    printErr: addError,
  });

  const smallerCPromise = new Promise((resolve) => {
    _smallerCPromiseLike.then(Module => {
      _smallerCInstance = Module;
      resolve();
    });
  });
  await smallerCPromise;

  _smallerCInstance!.FS.writeFile("/input.c", source, { flags: "w+" });

  const outputFile = "/output.s";
  const argv = ["./smallerc", "/input.c", outputFile];
  const args = [argv.length, str2ptrs(_smallerCInstance!, argv)];

  try {
    _smallerCInstance!.ccall("main", "number", ["number", "number"], args);
  }
  catch (e) {
    throw new Error("Error during event compile:\n" + errors.join("\n"));
  }

  let result = _smallerCInstance!.FS.readFile(outputFile, { encoding: "utf8" }) as string;
  result = fuseSections(result);
  return convertToNamedRegisters(result);
}

function str2ptr(env: EmscriptenModule, s: string): number {
  const ptr = env._malloc((s.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
  if (!ptr) {
    throw new Error("Null pointer returned in str2ptr");
  }

  for (let i = 0; i < s.length; i++) {
    env.setValue(ptr + i, s.charCodeAt(i), "i8");
  }
  env.setValue(ptr+s.length, 0, "i8");
  return ptr;
}

function str2ptrs(env: EmscriptenModule, strList: string[]): number {
  const listPtr = env._malloc(strList.length * Uint32Array.BYTES_PER_ELEMENT);
  if (!listPtr) {
    throw new Error("Null pointer returned in str2ptrs");
  }

  strList.forEach((s, idx) => {
    const strPtr = str2ptr(env, s);
    env.setValue(listPtr + (4 * idx), strPtr, "i32");
  });

  return listPtr;
}

const regNames = [
  ["r0", "$0"],
  ["at", "$1"],
  ["v0", "$2"],
  ["v1", "$3"],
  ["a0", "$4"],
  ["a1", "$5"],
  ["a2", "$6"],
  ["a3", "$7"],
  ["t0", "$8"],
  ["t1", "$9"],
  ["t2", "$10"],
  ["t3", "$11"],
  ["t4", "$12"],
  ["t5", "$13"],
  ["t6", "$14"],
  ["t7", "$15"],
  ["s0", "$16"],
  ["s1", "$17"],
  ["s2", "$18"],
  ["s3", "$19"],
  ["s4", "$20"],
  ["s5", "$21"],
  ["s6", "$22"],
  ["s7", "$23"],
  ["t8", "$24"],
  ["t9", "$25"],
  ["k0", "$26"],
  ["k1", "$27"],
  ["gp", "$28"],
  ["sp", "$29"],
  ["fp", "$30"],
  ["ra", "$31"],
];

function convertToNamedRegisters(assembly: string): string {
  // Backwards to replace $31 before $3
  for (let i = regNames.length - 1; i >= 0; i--) {
    assembly = assembly.replace(new RegExp("\\" + regNames[i][1], "g"), regNames[i][0]);
  }
  return assembly;
}

interface ISectionStrings {
  text: string[];
  data: string[];
  rdata: string[];
  bss: string[];
}

/**
 * The compiler emits each section in fragments.
 * They need to be fused into one, otherwise some labels could be broken.
 */
function fuseSections(assembly: string): string {
  const sections: ISectionStrings = {
    text: [],
    data: [],
    rdata: [],
    bss: [],
  };

  let curSection: keyof ISectionStrings = "text";

  assembly.split("\n").forEach(line => {
    switch (line.trim()) {
      case ".text":
        curSection = "text";
        break;
      case ".data":
        curSection = "data";
        break;
      case ".rdata":
        curSection = "rdata";
        break;
      case ".bss":
        curSection = "bss";
        break;
      default:
        sections[curSection].push(line);
        break;
    }
  });

  return `; .text
${sections.text.join("\n")}
; .data
${sections.data.join("\n")}
; .rdata
${sections.rdata.join("\n")}
; .bss
${sections.bss.join("\n")}`;
}


/*
 # Ident __floatsisf
 # Ident __floatunsisf
 # Ident __fixsfsi
 # Ident __fixunssfsi
 # Ident __addsf3
 # Ident __subsf3
 # Ident __negsf2
 # Ident __mulsf3
 # Ident __divsf3
 # Ident __lesf2
 # Ident __gesf2
 */