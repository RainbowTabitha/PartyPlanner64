PP64.ns("utils");

// MIPS ASM helper library
PP64.utils.MIPS = class MIPS {
  static REG = {
    R0: 0,
    AT: 1,
    V0: 2,
    V1: 3,
    A0: 4,
    A1: 5,
    A2: 6,
    A3: 7,
    T0: 8,
    T1: 9,
    T2: 10,
    T3: 11,
    T4: 12,
    T5: 13,
    T6: 14,
    T7: 15,
    S0: 16,
    S1: 17,
    S2: 18,
    S3: 19,
    S4: 20,
    S5: 21,
    S6: 22,
    S7: 23,
    T8: 24,
    T9: 25,
    K0: 26,
    K1: 27,
    GP: 28,
    SP: 29,
    S8: 30,
    RA: 31
  }

  static makeInst(inst) {
    if (!arguments.length)
      return null;

    // Oh so sensical V8 optimization.
    let args = new Array(arguments.length - 1);
    for (let i = 1; i < arguments.length; i++)
      args[i - 1] = arguments[i];

    switch (inst.toUpperCase()) {
      case "ADDIU":
        return MIPS._addiu.apply(MIPS, args);
      case "ADDU":
        return MIPS._addu.apply(MIPS, args);
      case "BEQ":
        return MIPS._beq.apply(MIPS, args);
      case "BNE":
        return MIPS._bne.apply(MIPS, args);
      case "BGTZ":
        return MIPS._bgtz.apply(MIPS, args);
      case "BLEZ":
        return MIPS._blez.apply(MIPS, args);
      case "J":
        return MIPS._j.apply(MIPS, args);
      case "JR":
        return MIPS._jr.apply(MIPS, args);
      case "JAL":
        return MIPS._jal.apply(MIPS, args);
      case "LUI":
        return MIPS._lui.apply(MIPS, args);
      case "LW":
        return MIPS._lw.apply(MIPS, args);
      case "SW":
        return MIPS._sw.apply(MIPS, args);
      default:
        throw `MIPS.makeInst: Invalid instruction ${inst}`;
    }
  }

  static getJALAddr(word) {
    if ((word & 0x0C000000) !== 0x0C000000)
      throw `MIPS.getJALAddr: ${word.toString(16)} is not a JAL instruction.`;

    return (word & 0x03FFFFFF) << 2;
  }

  static getRegSetUpperAndLower(address) {
    let lower = address & 0x0000FFFF;
    let upper = address >>> 16;
    if (lower & 0x8000)
      upper += 1;
    return [upper, lower];
  }

  static getRegSetAddress(upper, lower) {
    upper = upper & 0x0000FFFF;
    lower = lower & 0x0000FFFF;
    if (lower & 0x8000)
      upper -= 1;
    return ((upper << 16) | lower) & 0x7FFFFFFF;
  }

  static getFunctionLength(dataView, startOffset) {
    let offset = startOffset + 4;
    while (dataView.getUint32(offset) !== 0x03E00008 && offset < startOffset + 0x2000) {
      offset += 4;
    }

    if (dataView.getUint32(offset) === 0x03E00008)
      offset += 8;
    else
      return null;

    return offset - startOffset;
  }

  static _addiu(dst, reg, imm) {
    let base = 0x24000000;
    base = base | reg << 21;
    base = base | dst << 16;
    return base | (imm & 0xFFFF);
  }

  static _addu(dst, reg1, reg2) {
    let base = 0x00000021;
    base = base | reg1 << 21;
    base = base | reg2 << 16;
    base = base | dst << 11;
    return base;
  }

  static _beq(r1, r2, offset) {
    let base = 0x10000000;
    base = base | r1 << 21;
    base = base | r2 << 16;
    return base | ((offset >> 2) & 0xFFFF);
  }

  static _bne(r1, r2, offset) {
    let base = 0x14000000;
    base = base | r1 << 21;
    base = base | r2 << 16;
    return base | ((offset >> 2) & 0xFFFF);
  }

  static _bgtz(reg, offset) {
    let base = 0x1C000000;
    base = base | reg << 21;
    return base | ((offset >> 2) & 0xFFFF);
  }

  static _blez(reg, offset) {
    let base = 0x18000000;
    base = base | reg << 21;
    return base | ((offset >> 2) & 0xFFFF);
  }

  static _j(addr) {
    let base = 0x08000000;
    return base | (addr >>> 2);
  }

  static _jr(reg) {
    let base = 0x00000008;
    return base | (reg << 21);
  }

  static _jal(addr) {
    let base = 0x0C000000;
    return base | (addr >>> 2);
  }

  static _lui(dst, imm) {
    let base = 0x3C000000;
    base = base | dst << 16;
    return base | (imm & 0xFFFF);
  }

  // dst = MEM[reg + offset]
  static _lw(dst, reg, offset) {
    let base = 0x8C000000;
    base = base | reg << 21;
    base = base | dst << 16;
    return base | (offset & 0xFFFF);
  }

  // MEM[reg + offset]
  static _sw(src, dst, offset) {
    let base = 0xAC000000;
    base = base | dst << 21;
    base = base | src << 16;
    return base | (offset & 0xFFFF);
  }
};

var $MIPS = PP64.utils.MIPS;
