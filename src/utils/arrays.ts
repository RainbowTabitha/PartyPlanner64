import { createContext } from "./canvas";
import { $$hex } from "./debug";
import * as SparkMD5 from "../lib/js-spark-md5/spark-md5";

export function copyRange(outArr: ArrayBuffer | DataView, inArr: ArrayBuffer | DataView, outOffset: number, inOffset: number, len: number) {
  if (outArr instanceof ArrayBuffer)
    outArr = new DataView(outArr);
  if (inArr instanceof ArrayBuffer)
    inArr = new DataView(inArr);

  for (var i = 0; i < len; i++) {
    outArr.setUint8(outOffset + i, inArr.getUint8(inOffset + i));
  }
}

export function arrayToArrayBuffer(arr: number[]) {
  let buffer = new ArrayBuffer(arr.length);
  let u8arr = new Uint8Array(buffer);
  for (let i = 0; i < arr.length; i++) {
    u8arr[i] = arr[i];
  }
  return buffer;
}

export function hash(arr: any, startOffset: number, len: number) {
  // Can't be equal if our length would extend out of bounds.
  if (startOffset + len > arr.byteLength)
    return "";
  return SparkMD5.ArrayBuffer.hash(arr, { start: startOffset, length: len });
}

export function hashEqual(hashArgs: any, expected: string) {
  return hash.apply(null, hashArgs).toLowerCase() === expected.toLowerCase();
}

export function toHexString(buffer: ArrayBuffer | DataView, len: number = buffer.byteLength, lineLen: number = 0) {
  let output = "";
  let view: DataView;
  if (buffer instanceof ArrayBuffer)
    view = new DataView(buffer);
  else
    view = buffer;
  for (var i = 0; i < len; i++) {
    output += $$hex(view.getUint8(i), "") + ((i && lineLen && ((i + 1) % lineLen === 0)) ? "\n" : " ");
  }
  return output;
}

export function print(buffer: ArrayBuffer | DataView, len = buffer.byteLength, lineLen = 0) {
  console.log(toHexString(buffer, len, lineLen));
}

export function readBitAtOffset(buffer: ArrayBuffer | DataView, bitOffset: number) {
  let bufView = buffer;
  if (bufView instanceof ArrayBuffer)
    bufView = new DataView(bufView);
  let byteOffset = Math.floor(bitOffset / 8);
  let inByteOffset = bitOffset % 8;
  let mask = 0x80 >>> inByteOffset;
  let maskedBit = bufView.getUint8(byteOffset) & mask;
  return maskedBit ? 1 : 0;
}

export function readByteAtBitOffset(buffer: ArrayBuffer | DataView, bitOffset: number) {
  let bufView = buffer;
  if (bufView instanceof ArrayBuffer)
    bufView = new DataView(bufView);
  let shortOffset = Math.floor(bitOffset / 8);
  let inShortOffset = bitOffset % 8;
  let mask = 0xFF00 >>> inShortOffset;
  let maskedByte = bufView.getUint16(shortOffset) & mask;
  return maskedByte >>> (8 - inShortOffset);
}

export function arrayBufferToImageData(buffer: ArrayBuffer, width: number, height: number) {
  let canvasCtx = createContext(width, height);
  let bgImageData = canvasCtx.createImageData(width, height);
  let bufView = new Uint8Array(buffer);

  for (let i = 0; i < buffer.byteLength; i++) {
    bgImageData.data[i] = bufView[i];
  }

  return bgImageData;
}

export function arrayBufferToDataURL(buffer: ArrayBuffer, width: number, height: number) {
  let bgImageData = arrayBufferToImageData(buffer, width, height)
  let canvasCtx = createContext(width, height);
  canvasCtx.putImageData(bgImageData, 0, 0);
  return canvasCtx.canvas.toDataURL();
}

export function arrayBuffersEqual(first: ArrayBuffer, second: ArrayBuffer) {
  if (first.byteLength !== second.byteLength)
    return false;
  let firstArr = new Uint8Array(first);
  let secondArr = new Uint8Array(second);
  for (let i = 0; i < firstArr.byteLength; i++) {
    if (firstArr[i] !== secondArr[i])
      return false;
  }
  return true;
}

// Joins two ArrayBuffers
export function join(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer {
  if (!buffer1 || !buffer2) {
    return buffer1 || buffer2;
  }

  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer as ArrayBuffer;
}

/**
 * Tests if two arrays are equal.
 * They are equal if:
 *   - They are the same reference.
 *   - They have the same number of items
 *   - Each item is === across arrays.
 */
export function equal(a: any[], b: any[]) {
  if (a === b)
    return true;
  if (a.length !== b.length)
    return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i])
      return false;
  }
  return true;
}

/**
 * Creates the intersection of two arrays.
 * equalityFn takes two values and decides if they're equal.
 */
export function intersection(a: any[], b: any[], equalityFn = (a: any, b: any) => a === b) {
  const output = [];

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    for (let j = 0; j < b.length; j++) {
      if (equalityFn(aVal, b[j])) {
        output.push(aVal);
        break;
      }
    }
  }

  return output;
}