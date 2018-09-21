namespace PP64.utils.img {
// 5 bits each for RGB, 1 for alpha.
  export const RGBA5551 = class RGBA5551 {
    static toRGBA32(buffer: ArrayBuffer, width: number, height: number) {
      var outBuffer = new ArrayBuffer(width * height * 4);
      var outView = new Uint8Array(outBuffer);

      var inView = new DataView(buffer);
      var outIdx = 0;
      for (var i = 0; i < (width * height); i++) {
        var val = inView.getUint16(i * 2);
        outView[outIdx] = ((val & 0xF800) >>> 11) * 8;
        outView[outIdx + 1] = ((val & 0x07C0) >>> 6) * 8;
        outView[outIdx + 2] = ((val & 0x003E) >>> 1) * 8;
        outView[outIdx + 3] = (val & 0x0001) ? 0xFF : 0x00;
        outIdx += 4;
      }

      return outBuffer;
    }

    static fromRGBA32(buffer: ArrayBuffer, width: number, height: number) {
      var outBuffer = new ArrayBuffer(width * height * 2);
      var outView = new DataView(outBuffer);

      var inView = new Uint8Array(buffer);
      var inIdx = 0;
      for (var i = 0; i < width * height; i++) {
        var red = inView[inIdx] / 8;
        red <<= 11;
        var green = inView[inIdx + 1] / 8;
        green <<= 6;
        var blue = inView[inIdx + 2] / 8;
        blue <<= 1;
        var alpha = inView[inIdx + 3] >>> 7;

        outView.setUint16(i * 2, (red | green | blue | alpha) & 0xFFFF);
        inIdx += 4;
      }

      return outBuffer;
    }
  }
}
