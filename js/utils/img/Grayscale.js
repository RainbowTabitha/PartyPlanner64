PP64.ns("utils.img");

PP64.utils.img.Grayscale = class Grayscale {
  static toRGBA32(buffer, width, height, bpp) {
    var outBuffer = new ArrayBuffer(width * height * 4);
    var outView = new Uint8Array(outBuffer);

    var inView = new DataView(buffer);
    var outIdx = 0;
    for (var i = 0; i < width * height; i++) {
      var val;
      if (bpp === 8)
        val = inView.getUint8(i);
      else if (bpp === 4) {
        val = inView.getUint8(i / 2) & (i % 2 ? 0x0F : 0xF0);
        if (i % 2 === 0) {
          val >>= 4;
          val = val & 0x0F;
        }
        val = (val / 0x0F) * 0xFF;
      }
      else
        throw "bpp must be 4 or 8";
      outView[outIdx] = val;
      outView[outIdx + 1] = val;
      outView[outIdx + 2] = val;
      outView[outIdx + 3] = 0xFF;
      outIdx += 4;
    }

    return outBuffer;
  }

  static fromRGBA32(buffer, width, height, bpp) {
    throw "Grayscale.fromRGBA32ArrayBuffer not implemented";
  }
};
