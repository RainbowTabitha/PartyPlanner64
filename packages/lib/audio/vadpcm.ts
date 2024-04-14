/**
 * @file VADPCM decoding
 * Ported from work by Ice Mario and Subdrag
 * https://github.com/derselbst/N64SoundTools/blob/master/N64SoundListTool/N64SoundLibrary/N64AIFCAudio.cpp#L20619
 */

import { ALADPCMBook } from "./ALADPCMBook";

const itable = new Int16Array([
  0, 1, 2, 3, 4, 5, 6, 7, -8, -7, -6, -5, -4, -3, -2, -1,
]);

// const itable_half = new Int16Array([
//   0, 1, -2, -1
// ]);

export function decodeVADPCM(
  tblView: DataView,
  outRawData: ArrayBuffer,
  len: number,
  book: ALADPCMBook,
  decode8Only: boolean,
): number {
  const lastsmp = new Int16Array(8); // signed short[8]

  let index: number; // int
  let pred: number; // int
  let inIndex = 0;
  let outIndex = 0; // short *!
  let samples = 0; // int

  // flip the predictors (TODO: What does flip mean?)
  //let predsBuffer = new ArrayBuffer(32 * book.npredictors);
  const preds = new Int16Array(16 * book.npredictors); // new DataView(predsBuffer); // signed short *
  for (let p = 0; p < 8 * book.order * book.npredictors; p++) {
    preds[p] = book.predictors[p];
  }

  if (!decode8Only) {
    // Make sure length was actually a multiple of 9.
    let _len = Math.floor(len / 9) * 9;

    while (_len > 0) {
      index = (tblView.getUint8(inIndex) >> 4) & 0xf;
      pred = tblView.getUint8(inIndex) & 0xf;

      // to not make zelda crash but doesn't fix it
      pred = pred % book.npredictors;

      _len--;

      const pred1Index = pred * 16; // signed short *

      inIndex++;
      decode8(
        tblView,
        inIndex,
        outRawData,
        outIndex,
        index,
        preds,
        pred1Index,
        lastsmp,
      );
      inIndex += 4;
      _len -= 4;
      outIndex += 16;

      decode8(
        tblView,
        inIndex,
        outRawData,
        outIndex,
        index,
        preds,
        pred1Index,
        lastsmp,
      );
      inIndex += 4;
      _len -= 4;
      outIndex += 16;

      samples += 16;
    }
  } else {
    // Make sure length was actually a multiple of 5
    let _len = Math.floor(len / 5) * 5;

    while (_len > 0) {
      index = (tblView.getUint8(inIndex) >> 4) & 0xf;
      pred = tblView.getUint8(inIndex) & 0xf;

      // to not make zelda crash but doesn't fix it
      pred = pred % book.npredictors;

      _len--;

      const pred1Index = pred * 16;

      inIndex++;
      decode8Half(
        tblView,
        inIndex,
        outRawData,
        outIndex,
        index,
        preds,
        pred1Index,
        lastsmp,
      );
      inIndex += 2;
      _len -= 2;
      outIndex += 16;

      decode8Half(
        tblView,
        inIndex,
        outRawData,
        outIndex,
        index,
        preds,
        pred1Index,
        lastsmp,
      );
      inIndex += 2;
      _len -= 2;
      outIndex += 16;

      samples += 16;
    }
  }

  return samples;
}

function decode8(
  tblView: DataView,
  inIndex: number,
  outRawData: ArrayBuffer,
  outIndex: number,
  index: number,
  preds: Int16Array,
  pred1Index: number,
  lastsmp: Int16Array,
) {
  const tmp = new Int16Array(8); // signed short tmp[8];
  let total = 0; // signed long

  // memset(out, 0, sizeof(signed short)*8);

  const outView = new DataView(outRawData, outIndex);

  const pred2Index = pred1Index + 8; // signed short *

  //printf("pred2[] = %x\n" , pred2[0]);
  for (let i = 0; i < 8; i++) {
    if (i & 1) {
      tmp[i] = itable[tblView.getUint8(inIndex) & 0xf] << index;
      inIndex++;
    } else {
      tmp[i] = itable[(tblView.getUint8(inIndex) >> 4) & 0xf] << index;
    }
    tmp[i] = signExtend(index + 4, tmp[i]);
  }

  for (let i = 0; i < 8; i++) {
    total = preds[pred1Index + i] * lastsmp[6];
    total += preds[pred2Index + i] * lastsmp[7];

    if (i > 0) {
      for (let x = i - 1; x > -1; x--) {
        total += tmp[i - 1 - x] * preds[pred2Index + x];
        //printf("sample: %x - pred: %x - _smp: %x\n" , ((i-1)-x) , pred2[x] , tmp[((i-1)-x)]);
      }
    }

    //printf("pred = %x | total = %x\n" , pred2[0] , total);
    let sample = 0; // signed short
    const result = ((tmp[i] << 0xb) + total) >> 0xb;
    if (result > 32767) sample = 32767;
    else if (result < -32768) sample = -32768;
    else sample = result;

    outView.setInt16(i * 2, sample, true);
  }

  // update the last sample set for subsequent iterations
  for (let i = 0; i < 8; i++) {
    lastsmp[i] = outView.getInt16(i * 2, true);
  }
}

function decode8Half(
  tblView: DataView,
  inIndex: number,
  outRawData: ArrayBuffer,
  outIndex: number,
  index: number,
  preds: Int16Array,
  pred1Index: number,
  lastsmp: Int16Array,
) {
  const tmp = new Int16Array(8); // signed short tmp[8];
  let total = 0; // signed long

  //memset(out, 0, sizeof(signed short)*8);

  const outView = new DataView(outRawData, outIndex);

  const pred2Index = pred1Index + 8; // signed short *

  //printf("pred2[] = %x\n" , pred2[0]);

  tmp[0] = (((tblView.getUint8(inIndex) & 0xc0) >> 6) & 0x3) << index;
  tmp[0] = signExtend(index + 2, tmp[0]);
  tmp[1] = (((tblView.getUint8(inIndex) & 0x30) >> 4) & 0x3) << index;
  tmp[1] = signExtend(index + 2, tmp[1]);
  tmp[2] = (((tblView.getUint8(inIndex) & 0x0c) >> 2) & 0x3) << index;
  tmp[2] = signExtend(index + 2, tmp[2]);
  tmp[3] = (tblView.getUint8(inIndex) & 0x03 & 0x3) << index;
  inIndex++;
  tmp[3] = signExtend(index + 2, tmp[3]);
  tmp[4] = (((tblView.getUint8(inIndex) & 0xc0) >> 6) & 0x3) << index;
  tmp[4] = signExtend(index + 2, tmp[4]);
  tmp[5] = (((tblView.getUint8(inIndex) & 0x30) >> 4) & 0x3) << index;
  tmp[5] = signExtend(index + 2, tmp[5]);
  tmp[6] = (((tblView.getUint8(inIndex) & 0x0c) >> 2) & 0x3) << index;
  tmp[6] = signExtend(index + 2, tmp[6]);
  tmp[7] = (tblView.getUint8(inIndex) & 0x03 & 0x3) << index;
  inIndex++;
  tmp[7] = signExtend(index + 2, tmp[7]);

  for (let i = 0; i < 8; i++) {
    total = preds[pred1Index + i] * lastsmp[6];
    total += preds[pred2Index + i] * lastsmp[7];

    if (i > 0) {
      for (let x = i - 1; x > -1; x--) {
        total += tmp[i - 1 - x] * preds[pred2Index + x];
        //printf("sample: %x - pred: %x - _smp: %x\n" , ((i-1)-x) , pred2[x] , tmp[((i-1)-x)]);
      }
    }

    //printf("pred = %x | total = %x\n" , pred2[0] , total);
    let sample = 0; // signed short
    const result = ((tmp[i] << 0xb) + total) >> 0xb;
    if (result > 32767) sample = 32767;
    else if (result < -32768) sample = -32768;
    else sample = result;

    outView.setInt16(i * 2, sample, true);
  }

  // update the last sample set for subsequent iterations
  for (let i = 0; i < 8; i++) {
    lastsmp[i] = outView.getInt16(i * 2, true);
  }
}

/**
 * Sign extends a number.
 * @param b number of bits representing the number in x
 * @param x sign extend this b-bit number to r
 */
function signExtend(b: number, x: number) {
  const m = 1 << (b - 1); // mask can be pre-computed if b is fixed
  x = x & ((1 << b) - 1); // (Skip this if bits in x above position b are already zero.)
  return (x ^ m) - m;
}
