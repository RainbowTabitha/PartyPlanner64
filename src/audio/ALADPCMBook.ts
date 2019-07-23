export class ALADPCMBook {
  private __type: string = "ALADPCMBook";

  public order!: number;
  public npredictors!: number;
  public predictors!: number[];

  constructor(view: DataView, offset: number) {
    this._extract(view, offset);
  }

  _extract(view: DataView, offset: number) {
    this.order = view.getInt32(offset);
    this.npredictors = view.getInt32(offset + 4);

    const predictorCount = this.order * this.npredictors * 8;
    this.predictors = new Array(predictorCount);
    for (let i = 0; i < predictorCount; i++) {
      this.predictors[i] = view.getInt16(offset + 8 + (i * 2));
    }
  }
}

// https://github.com/derselbst/N64SoundTools/blob/master/N64SoundListTool/N64SoundLibrary/N64AIFCAudio.cpp#L20065
