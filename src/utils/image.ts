import { createContext } from "./canvas";

// Cuts an image from a bigger image at x,y coordinates.
// A mystery: why didn't I use canvas?
export function cutFromWhole(srcBuffer: ArrayBuffer, srcWidth: number, srcHeight: number, bpp: number, x: number, y: number, width: number, height: number) {
  let pieceWidth = width * (bpp / 8);
  let outBuffer = new ArrayBuffer(pieceWidth * height);
  let outArr = new Uint8Array(outBuffer);
  let inArr = new Uint8Array(srcBuffer);

  let srcByteWidth = (srcWidth * (bpp / 8));
  let pieceXStart = (x * (bpp / 8));
  let outPos = 0;
  for (let yi = y; yi < (y + height); yi++) {
    let rowIdx = pieceXStart + (srcByteWidth * yi);
    for (let j = 0; j < pieceWidth; j++) {
      outArr[outPos++] = inArr[rowIdx + j]
    }
  }
  return outBuffer;
}

export function toArrayBuffer(image: HTMLImageElement, width: number, height: number) {
  let canvasCtx = createContext(width, height);
  canvasCtx.drawImage(image, 0, 0, width, height);
  return canvasCtx.getImageData(0, 0, width, height).data.buffer;
}

export function invertColor(hex: number) {
  const rOrig = (hex >>> 16) & 0xFF;
  const gOrig = (hex >>> 8) & 0xFF;
  const bOrig = hex & 0xFF;

  const r = (255 - rOrig);
  const g = (255 - gOrig);
  const b = (255 - bOrig);

  return ((r << 16) | (g << 8) | b);
}
