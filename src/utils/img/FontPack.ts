/*
 * The game fonts are packaged in a special file format.
 */

import { BMPtoRGBA } from "./BMP";
import { RGBA5551toRGBA32 } from "./RGBA5551";

const CHAR_WIDTH = 10;
const CHAR_HEIGHT = 12;
const CHAR_PIXELS = CHAR_WIDTH * CHAR_HEIGHT;

/** Does the given file appear to be a font pack? */
export function isFontPack(buffer: ArrayBuffer): boolean {
  const view = new DataView(buffer);

  // Sanity check size and offsets.
  if (view.byteLength < 32) {
    return false;
  }

  const paletteOffset = view.getUint32(0);
  const imagesOffset = view.getUint32(4);
  const charsOffset = view.getUint32(8);
  if (paletteOffset >= imagesOffset || imagesOffset >= charsOffset) {
    return false;
  }
  const paletteSize = imagesOffset - paletteOffset;
  if ((paletteSize % 2) !== 0) {
    return false;
  }

  const imagesSize = charsOffset - imagesOffset;
  if ((imagesSize % CHAR_PIXELS) !== 0) {
    return false;
  }

  const charsSize = view.byteLength - charsOffset;
  if ((charsSize % (CHAR_PIXELS / 2)) !== 0) {
    return false;
  }

  return true;
}

export interface IFontPack {
  bpp: number;
  images: ArrayBuffer[];
  chars: ArrayBuffer[];
}

export function fontPackToRGBA32(buffer: ArrayBuffer): IFontPack {
  const pack: IFontPack = {
    bpp: 32,
    images: [],
    chars: [],
  };

  const view = new DataView(buffer);
  const paletteOffset = view.getUint32(0);
  const imagesOffset = view.getUint32(4);
  const charsOffset = view.getUint32(8);

  // Extract palette.
  const palette5551: number[] = [];
  const paletteLen = (imagesOffset - paletteOffset) / 2;
  for (let i = 0; i < paletteLen; i++) {
    palette5551.push(view.getUint16(paletteOffset + (i * 2)));
  }

  let curImageOffset = imagesOffset;
  while (curImageOffset < charsOffset) {
    const rgba5551 = BMPtoRGBA(new DataView(buffer, curImageOffset, CHAR_PIXELS), palette5551, 8, 16);
    const rgba32 = RGBA5551toRGBA32(rgba5551, CHAR_WIDTH, CHAR_HEIGHT);
    pack.images.push(rgba32);

    curImageOffset += CHAR_PIXELS;
  }

  let curCharOffset = charsOffset;

  // Intensity palette.
  const fakePalette = [0];
  for (let i = 1; i < 16; i++) {
    fakePalette.push(Math.floor(0xFF * ((i + 1) / 16)));
  }

  while (curCharOffset < buffer.byteLength) {
    const rgba32 = BMPtoRGBA(new DataView(buffer, curCharOffset, CHAR_PIXELS / 2), fakePalette, 4, 32);
    pack.chars.push(rgba32);

    curCharOffset += CHAR_PIXELS / 2;
  }

  return pack;
}
