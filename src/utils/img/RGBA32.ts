// Used internally for now by board select image.
// Ideally we can implement fancy image color count reduction instead.
export function make8Bit(u32arr: Uint32Array, width: number, height: number) {
  for (let i = 0; i < (width * height); i++) {
    let val = u32arr[i];
    val = val & 0xC0C0C0C0;
    val |= val >>> 2;
    val |= val >>> 2;
    val |= val >>> 2;
    u32arr[i] = val;
  }
}
