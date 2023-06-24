import { ALEnvelope } from "./ALEnvelope";
import { ALKeyMap } from "./ALKeyMap";
import { ALWaveTable } from "./ALWaveTable";
import { ISound } from "./ALSound";

export class ALSoundSimple implements ISound {
  private __type = "ALSoundSimple";

  public env!: ALEnvelope;
  public keymap!: ALKeyMap;
  public wave!: ALWaveTable;
  public samplePan!: number;
  public sampleVolume!: number;
  public flags!: number;
  public sampleRate!: number;

  constructor(view: DataView, offset: number) {
    this._extract(view, offset);
  }

  _extract(view: DataView, offset: number) {
    const envOffset = view.getUint32(offset);
    this.env = new ALEnvelope(view, envOffset);

    this.sampleRate = view.getUint32(offset + 4);

    const waveOffset = view.getUint32(offset + 8);
    this.wave = new ALWaveTable(view, waveOffset);

    this.samplePan = view.getUint8(offset + 12);
    this.sampleVolume = view.getUint8(offset + 13);
    this.flags = view.getUint8(offset + 14);
  }
}
