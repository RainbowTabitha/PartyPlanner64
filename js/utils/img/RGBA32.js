PP64.ns("utils.img");

PP64.utils.img.RGBA32 = class RGBA32 {
  // Used internally for now by board select image.
  // Ideally we can implement fancy image color count reduction instead.
  static make8Bit(u32arr, width, height) {
    for (let i = 0; i < (width * height); i++) {
      let val = u32arr[i];
      val = val & 0xC0C0C0C0;
      val |= val >>> 2;
      val |= val >>> 2;
      val |= val >>> 2;
      u32arr[i] = val;
    }
  }
};
