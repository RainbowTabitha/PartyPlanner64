export class ALADPCMBook {
  private __type: string = "ALADPCMBook";

  public order!: number;
  public npredictors!: number;
  public book!: number[];

  constructor(B1view: DataView, offset: number) {
    this._extract(B1view, offset);
  }

  _extract(B1view: DataView, offset: number) {
    this.order = B1view.getInt32(offset);
    this.npredictors = B1view.getInt32(offset + 4);

    const predictorCount = this.order * this.npredictors * 8;
    this.book = new Array(predictorCount);
    for (let i = 0; i < predictorCount; i++) {
      this.book[i] = B1view.getInt16(offset + 8 + (i * 2));
    }
  }
}

// https://github.com/derselbst/N64SoundTools/blob/master/N64SoundListTool/N64SoundLibrary/N64AIFCAudio.cpp#L20065
