import { ALEnv } from "./ALEnv";
import { ALKey } from "./ALKey";
import { ALWave } from "./ALWave";

export class ALSound {
  private __type: string = "ALSound";

  public env!: ALEnv;
  public keymap!: ALKey;
  public wave!: ALWave;
  public samplePan!: number;
  public sampleVolume!: number;
  public flags!: number;

  constructor(B1view: DataView, soundOffset: number) {
    this._extract(B1view, soundOffset);
  }

  _extract(B1view: DataView, soundOffset: number) {
    let envOffset = B1view.getUint32(soundOffset);
    this.env = new ALEnv(B1view, envOffset);

    let keymapOffset = B1view.getUint32(soundOffset + 4);
    this.keymap = new ALKey(B1view, keymapOffset);

    let waveOffset = B1view.getUint32(soundOffset + 8);
    this.wave = new ALWave(B1view, waveOffset);

    this.samplePan = B1view.getUint8(soundOffset + 12);
    this.sampleVolume = B1view.getUint8(soundOffset + 13);
    this.flags = B1view.getUint8(soundOffset + 14);
  }
}
