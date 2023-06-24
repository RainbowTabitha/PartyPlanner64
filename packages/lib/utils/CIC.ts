import { $$log, $$hex } from "./debug";

/**
 * Different possible CIC variations.
 * MP uses 6102 but we might as well write this in a generic way.
 */
const Type = {
  "6101": 6101,
  "6102": 6102,
  "6103": 6103,
  "6105": 6105,
  "6106": 6106,
};

// We need to initialize a CRC table once that we can reuse.
const _CRCTable = new Array(256);
(function () {
  const crcTable = _CRCTable;

  const poly = 0xedb88320;
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 8; j > 0; j--) {
      if (crc & 1) crc = ((crc >>> 1) ^ poly) >>> 0;
      else crc >>>= 1;
    }
    crcTable[i] = crc >>> 0;
  }
})();

/**
 * N64 ROMs have checksums that need to be correct to run on real hardware.
 * The following logic is responsible for recalculating those checksums.
 *
 * I have no idea who originally did the work to figure all this out. I mostly
 * ported the source code from spinout182's n64crc.c code.
 */

/** Fixes the checksum of a ROM buffer. */
export function fixChecksum(buffer: ArrayBuffer) {
  function ROL(i: number, b: number) {
    return (i << b) | (i >>> (32 - b));
  }

  const bootcode = _getGameCIC(buffer);
  const seed = _getChecksumSeed(bootcode);
  let [t1, t2, t3, t4, t5, t6] = [seed, seed, seed, seed, seed, seed];

  $$log(`CIC.fixChecksum -> Bootcode: ${bootcode}, seed: ${$$hex(seed)}`);

  const romView = new DataView(buffer);
  const N64_HEADER_SIZE = 0x40;
  const CHECKSUM_START = 0x00001000;
  const CHECKSUM_LENGTH = 0x00100000;
  let i = CHECKSUM_START;
  while (i < CHECKSUM_START + CHECKSUM_LENGTH) {
    const d = romView.getUint32(i);
    if ((t6 + d) >>> 0 < t6) t4++;
    t4 >>>= 0;
    t6 += d;
    t6 >>>= 0;
    t3 ^= d;
    t3 >>>= 0;
    const r = ROL(d, d & 0x1f) >>> 0;
    t5 += r;
    t5 >>>= 0;
    if (t2 > d) t2 ^= r;
    else t2 ^= (t6 ^ d) >>> 0;
    t2 >>>= 0;

    if (bootcode === 6105)
      t1 += romView.getUint32(N64_HEADER_SIZE + 0x0710 + (i & 0xff)) ^ d;
    else t1 += (t5 ^ d) >>> 0;
    t1 >>>= 0;

    i += 4;
  }

  let crc1, crc2;
  if (bootcode === 6103) {
    crc1 = t6 ^ t4;
    crc1 >>>= 0;
    crc1 += t3;
    crc1 >>>= 0;
    crc2 = t5 ^ t2;
    crc2 >>>= 0;
    crc2 += t1;
    crc2 >>>= 0;
  } else if (bootcode === 6106) {
    crc1 = t6 * t4;
    crc1 >>>= 0;
    crc1 += t3;
    crc1 >>>= 0;
    crc2 = t5 * t2;
    crc2 >>>= 0;
    crc2 += t1;
    crc2 >>>= 0;
  } else {
    crc1 = t6 ^ t4;
    crc1 >>>= 0;
    crc1 ^= t3;
    crc1 >>>= 0;
    crc2 = t5 ^ t2;
    crc2 >>>= 0;
    crc2 ^= t1;
    crc2 >>>= 0;
  }

  romView.setUint32(0x10, crc1);
  romView.setUint32(0x14, crc2);

  $$log(`CIC.fixChecksum -> CRC1: ${$$hex(crc1)}, CRC2: ${$$hex(crc2)}`);
}

function _getChecksumSeed(bootcode: number) {
  switch (bootcode) {
    case 6101:
    case 6102:
      return 0xf8ca4ddc;
    case 6103:
      return 0xa3886759;
    case 6105:
      return 0xdf26f436;
    case 6106:
      return 0x1fea617a;
  }
  throw new Error(`CIC._getChecksumSeed: Bad bootcode ${bootcode}`);
}

function _getGameCIC(buffer: ArrayBuffer) {
  const N64_HEADER_SIZE = 0x40;
  const N64_BC_SIZE = 0x1000 - N64_HEADER_SIZE;
  const cicTestingArr = new Uint8Array(buffer, N64_HEADER_SIZE, N64_BC_SIZE);
  const crc = _crc32(cicTestingArr);
  switch (crc) {
    case 0x6170a4a1:
      return Type[6101];
    case 0x90bb6cb5:
      return Type[6102];
    case 0x0b050ee0:
      return Type[6103];
    case 0x98bc2c86:
      return Type[6105];
    case 0xacc8580a:
      return Type[6106];
  }
  return Type[6105]; // Why is this the default?
}

function _crc32(arr: Uint8Array) {
  const len = arr.byteLength;
  let crc = 0xffffffff;
  const crcTable = _CRCTable;
  for (let i = 0; i < len; i++) {
    crc = ((crc >>> 8) ^ crcTable[((crc ^ arr[i]) >>> 0) & 0xff]) >>> 0;
  }
  return ~crc >>> 0;
}
