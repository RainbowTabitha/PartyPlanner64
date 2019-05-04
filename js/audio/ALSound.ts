import { ALEnvelope } from "./ALEnvelope";
import { ALKeyMap } from "./ALKeyMap";
import { ALWaveTable } from "./ALWaveTable";

export interface ISound {
  env: ALEnvelope;
  keymap?: ALKeyMap;
  wave: ALWaveTable;
  samplePan: number;
  sampleVolume: number;
  flags: number;
}

export class ALSound implements ISound {
  private __type: string = "ALSound";

  public env!: ALEnvelope;
  public keymap!: ALKeyMap;
  public wave!: ALWaveTable;
  public samplePan!: number;
  public sampleVolume!: number;
  public flags!: number;

  constructor(B1view: DataView, soundOffset: number) {
    this._extract(B1view, soundOffset);
  }

  _extract(B1view: DataView, soundOffset: number) {
    const envOffset = B1view.getUint32(soundOffset);
    this.env = new ALEnvelope(B1view, envOffset);

    const keymapOffset = B1view.getUint32(soundOffset + 4);
    this.keymap = new ALKeyMap(B1view, keymapOffset);

    const waveOffset = B1view.getUint32(soundOffset + 8);
    this.wave = new ALWaveTable(B1view, waveOffset);

    this.samplePan = B1view.getUint8(soundOffset + 12);
    this.sampleVolume = B1view.getUint8(soundOffset + 13);
    this.flags = B1view.getUint8(soundOffset + 14);
  }
}
