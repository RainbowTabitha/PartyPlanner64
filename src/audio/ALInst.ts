import { ALSound } from "./ALSound";

export class ALInst {
  private __type: string = "ALInst";

  public volume!: number;
  public pan!: number;
  public priority!: number;
  public flags!: number;
  public tremType!: number;
  public tremRate!: number;
  public tremDepth!: number;
  public tremDelay!: number;
  public vibType!: number;
  public vibRate!: number;
  public vibDepth!: number;
  public vibDelay!: number;
  public bendRange!: number;
  public sounds: ALSound[] = [];

  constructor(B1view: DataView, instOffset: number) {
    this._extract(B1view, instOffset);
  }

  _extract(B1view: DataView, instOffset: number) {
    this.volume = B1view.getUint8(instOffset);
    this.pan = B1view.getUint8(instOffset + 1);
    this.priority = B1view.getUint8(instOffset + 2);
    this.flags = B1view.getUint8(instOffset + 3);
    this.tremType = B1view.getUint8(instOffset + 4);
    this.tremRate = B1view.getUint8(instOffset + 5);
    this.tremDepth = B1view.getUint8(instOffset + 6);
    this.tremDelay = B1view.getUint8(instOffset + 7);
    this.vibType = B1view.getUint8(instOffset + 8);
    this.vibRate = B1view.getUint8(instOffset + 9);
    this.vibDepth = B1view.getUint8(instOffset + 10);
    this.vibDelay = B1view.getUint8(instOffset + 11);
    this.bendRange = B1view.getInt16(instOffset + 12);

    const soundCount = B1view.getInt16(instOffset + 14);
    for (let i = 0; i < soundCount; i++) {
      const soundOffset = B1view.getUint32(instOffset + 16 + (i * 4));
      this.sounds.push(new ALSound(B1view, soundOffset));
    }
  }
}