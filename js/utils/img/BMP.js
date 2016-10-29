PP64.ns("utils.img");

// Bitmap format utility methods.
PP64.utils.img.BMP = class BMP {
  static toRGBA(buffer, palette, inBpp, outBpp) {
    let inView = buffer;
    if (!(inView instanceof DataView))
      inView = new DataView(buffer);
    let outByteLength = inView.byteLength * (outBpp / inBpp);
    let outBuffer = new ArrayBuffer(outByteLength);
    let outView = new DataView(outBuffer);

    let inIdx = 0;
    let outIndex = 0;
    let paletteIdx;
    let outPixelByteCount = outBpp / 8;
    let outSetUintFn = "setUint" + outBpp;
    while (outIndex < outByteLength) {
      if (inBpp === 8) {
        paletteIdx = inView.getUint8(inIdx);
        outView[outSetUintFn](outIndex, palette[paletteIdx]);
        inIdx += 1;
        outIndex += outPixelByteCount;
      }
      else if (inBpp === 4) {
        paletteIdx = (inView.getUint8(inIdx) & 0xF0) >> 4;
        outView[outSetUintFn](outIndex, palette[paletteIdx]);
        outIndex += outPixelByteCount;

        paletteIdx = inView.getUint8(inIdx) & 0x0F;
        outView[outSetUintFn](outIndex, palette[paletteIdx]);
        outIndex += outPixelByteCount;

        inIdx += 1;
      }
      else if (inBpp === 2) {
        paletteIdx = (inView.getUint8(inIdx) & 0xC0) >> 6;
        outView[outSetUintFn](outIndex, palette[paletteIdx]);
        outIndex += outPixelByteCount;

        paletteIdx = (inView.getUint8(inIdx) & 0x30) >> 4;
        outView[outSetUintFn](outIndex, palette[paletteIdx]);
        outIndex += outPixelByteCount;

        paletteIdx = (inView.getUint8(inIdx) & 0x0C) >> 2;
        outView[outSetUintFn](outIndex, palette[paletteIdx]);
        outIndex += outPixelByteCount;

        paletteIdx = inView.getUint8(inIdx) & 0x03;
        outView[outSetUintFn](outIndex, palette[paletteIdx]);
        outIndex += outPixelByteCount;

        inIdx += 1;
      }
      else
        throw `Cannot decode palette with bpp: ${inBpp}`;
    }

    return outBuffer;
  }

  static fromRGBA(buffer, inBpp, outBpp) {
    let pixelView = buffer;
    if (!(pixelView instanceof DataView))
      pixelView = new DataView(buffer);

    let palette = {
      colors: [],
      bpp: inBpp
    };

    let paletteKeyMap = {};

    // FIXME: Could be one loop if we are trusting. If we are not, perform indexing?

    // Go through and determine the palette.
    let pixelByteCount = inBpp / 8;
    let inGetUintFn = "getUint" + inBpp;
    let curPixelOffset = 0;
    while (curPixelOffset < buffer.byteLength) {
      let color = pixelView[inGetUintFn](curPixelOffset);
      if (paletteKeyMap.hasOwnProperty(color.toString(16))) {
        curPixelOffset += pixelByteCount;
        continue;
      }
      paletteKeyMap[color.toString(16)] = palette.colors.length;
      palette.colors.push(color);

      curPixelOffset += pixelByteCount;
    }

    // Now write the bitmap itself.
    let bmpBuffer = new ArrayBuffer((buffer.byteLength / pixelByteCount) * (outBpp / 8));
    let bmpView = new DataView(bmpBuffer);
    let outSetUintFn = "setUint" + outBpp;
    let outIndex = 0;
    curPixelOffset = 0;
    while (outIndex < bmpBuffer.byteLength) {
      if (outBpp === 8) {
        let color = pixelView[inGetUintFn](curPixelOffset);
        let paletteIndex = paletteKeyMap[color.toString(16)];
        bmpView[outSetUintFn](outIndex, paletteIndex);
        curPixelOffset += pixelByteCount;
        outIndex++;
      }
      // else if (outBpp === 4) {
      // }
      // else if (outBpp === 2) {
      // }
      else
        throw `Cannot encode palette with bpp: ${outBpp}`;
    }

    return [bmpBuffer, palette];
  }
};
