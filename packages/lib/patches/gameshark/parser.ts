import { $$hex, $$log } from "../../utils/debug";

export const Opcodes: { [name: string]: number } = {
  WRITE8: 0x80,
  WRITE16: 0x81,
  IF8: 0xd0,
  IF16: 0xd1,
  IFNOT8: 0xd2,
  IFNOT16: 0xd3,
};

export interface ICode {
  opcode: string;
  addr: number;
  value: number;
}

/** Takes a string of gameshark codes and produces an array of objects representing them. */
export class Parser {
  static parse(codeString: string): ICode[] | null {
    const pieces = Parser.splitInput(codeString);
    if (!pieces.length) {
      $$log("Gameshark code string was empty");
      return null;
    }

    if (pieces.length % 2) {
      $$log("Gameshark code string was malformed");
      return null;
    }

    const codes = [];
    for (let i = 0; i < pieces.length; i += 2) {
      let inst = parseInt(pieces[i], 16);
      let value = parseInt(pieces[i + 1], 16);

      if (!inst) {
        $$log(`Invalid code instruction: ${pieces[i]}`);
        return null;
      }

      const code = Parser.getCode(inst, value);
      if (!code) {
        $$log(`Could not parse code: ${$$hex(inst)} ${$$hex(value)}`);
        return null;
      }

      codes.push(code);
    }

    return codes;
  }

  static getCode(inst: number, value: number): ICode | null {
    const opcode = Parser.getOpcode(inst);
    if (opcode === null) {
      return null;
    }

    const addr = (inst & 0x00ffffff) | 0x80000000;

    if (Parser.opcodeHas8BitValue(opcode)) {
      value = value & 0x00ff;
    }

    return {
      opcode,
      addr,
      value,
    };
  }

  static getOpcode(inst: number): string | null {
    const upper8 = (inst & 0xff000000) >>> 24;
    if (!upper8) {
      return null;
    }

    const types = Opcodes;
    for (let type in types) {
      if (!types.hasOwnProperty(type)) {
        continue;
      }
      if (types[type] === upper8) {
        return type;
      }
    }

    return null;
  }

  static opcodeHas8BitValue(opcode: string) {
    if (opcode === "WRITE8" || opcode === "IF8" || opcode === "IFNOT8") {
      return true;
    }

    return false;
  }

  static splitInput(codeString: string) {
    if (!codeString) {
      return [];
    }
    return codeString.match(/\S+/g) || [];
  }

  static printCodes(codes: ICode[]) {
    for (let i = 0; i < codes.length; i++) {
      console.log(
        `${codes[i].opcode} ${$$hex(codes[i].addr)} ${$$hex(codes[i].value)}`,
      );
    }
  }
}
