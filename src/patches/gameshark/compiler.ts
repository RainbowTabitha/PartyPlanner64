import { $$log } from "../../utils/debug";
import { parse } from "mips-inst";
import { ICode } from "./parser";

// Compiler is a gross exaggeration.
// This produces the MIPS ASM equivalent of parsed gameshark codes.
export class Compiler {
  private REG1: string;
  private REG2: string;

  constructor() {
    // Use the stack and saved registers instead of K0/K1?
    this.REG1 = "A3";
    this.REG2 = "AT";
  }

  // Returns an ArrayBuffer of MIPS instructions for a Gameshark hook
  compile(codes: ICode[]) {
    let insts: number[] = [];
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];

      let result;
      const method = "compile" + code.opcode;
      if (typeof (this as any)[method] === "function") {
        result = (this as any)[method](code);
      }

      if (!result) {
        $$log("Error compiling code", code);
        return null;
      }

      insts = insts.concat(result);
    }

    // Somewhat awkward to ensure big endianness in output.
    const outBuffer = new ArrayBuffer(insts.length * 4);
    const outView = new DataView(outBuffer);
    for (let i = 0; i < insts.length; i++) {
      outView.setUint32(i * 4, insts[i]);
    }

    return outBuffer;
  }

  // http://gamehacking.org/wiki/Hacking_N64#Code_Handler_Hacks

  compileWRITE8(code: ICode) {
    return parse(`
      LUI ${this.REG1} ${this.getAddrUpper(code.addr)}
      ORI ${this.REG1} ${this.REG1} ${this.getAddrLower(code.addr)}
      ADDIU ${this.REG2} R0 ${code.value}
      SB ${this.REG2} 0(${this.REG1})
    `);
  }

  compileWRITE16(code: ICode) {
    return parse(`
      LUI ${this.REG1} ${this.getAddrUpper(code.addr)}
      ORI ${this.REG1} ${this.REG1} ${this.getAddrLower(code.addr)}
      ADDIU ${this.REG2} R0 ${code.value}
      SH ${this.REG2} 0(${this.REG1})
    `);
  }

  compileIF8(code: ICode) {
    return parse(`
      LUI ${this.REG1} ${this.getAddrUpper(code.addr)}
      ORI ${this.REG1} ${this.REG1} ${this.getAddrLower(code.addr)}
      LB ${this.REG1} 0(${this.REG1})
      ADDIU ${this.REG2} R0 ${code.value}
      BNE ${this.REG1} ${this.REG2} 4
    `);
  }

  compileIF16(code: ICode) {
    return parse(`
      LUI ${this.REG1} ${this.getAddrUpper(code.addr)}
      ORI ${this.REG1} ${this.REG1} ${this.getAddrLower(code.addr)}
      LH ${this.REG1} 0(${this.REG1})
      ADDIU ${this.REG2} R0 ${code.value}
      BNE ${this.REG1} ${this.REG2} 4
    `);
  }

  compileIFNOT8(code: ICode) {
    return parse(`
      LUI ${this.REG1} ${this.getAddrUpper(code.addr)}
      ORI ${this.REG1} ${this.REG1} ${this.getAddrLower(code.addr)}
      LB ${this.REG1} 0(${this.REG1})
      ADDIU ${this.REG2} R0 ${code.value}
      BEQ ${this.REG1} ${this.REG2} 4
    `);
  }

  compileIFNOT16(code: ICode) {
    return parse(`
      LUI ${this.REG1} ${this.getAddrUpper(code.addr)}
      ORI ${this.REG1} ${this.REG1} ${this.getAddrLower(code.addr)}
      LH ${this.REG1} 0(${this.REG1})
      ADDIU ${this.REG2} R0 ${code.value}
      BEQ ${this.REG1} ${this.REG2} 4
    `);
  }

  getAddrUpper(addr: number) {
    return (addr & 0xFFFF0000) >>> 16;
  }

  getAddrLower(addr: number) {
    return addr & 0x0000FFFF;
  }
}
