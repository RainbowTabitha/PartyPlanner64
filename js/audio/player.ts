import * as MidiPlayer from "midi-player-js";
import { audio } from "../fs/audio";
import { S2 } from "./S2";
import { parseGameMidi } from "./midi";
import { extractWavSound } from "./wav";
import { ALKeyMap } from "./ALKeyMap";

let _audioContext: AudioContext;
let _playing: boolean = false;

export function playMidi(table: number, index: number): AudioPlayerController {
  if (_playing) {
    throw new Error("Cannot play more than one MIDI at once.");
  }
  if (!_audioContext) {
    _audioContext = new AudioContext();
  }

  const s2 = audio.getSequenceTable(table)!;
  console.log(s2);
  const gameMidiBuffer = s2.midis[index].buffer;
  const midi = parseGameMidi(new DataView(gameMidiBuffer), gameMidiBuffer.byteLength);

  const promises = [];
  const midiData: any = [];
  const soundbankIndex = s2.midis[index].soundbankIndex;
  const bank = s2.soundbanks.banks[soundbankIndex];
  for (let t = 0; t < bank.instruments.length; t++) {
    midiData[t] = [];
    const instrument = bank.instruments[t];
    for (let s = 0; s < instrument.sounds.length; s++) {
      const sound = instrument.sounds[s];
      const wav = extractWavSound(s2.tbl, bank, t, s);
      const middt = midiData[t];
      middt.push(null);
      const insertIndex = middt.length - 1;
      const instrumentVolume = instrument.volume;
      const prom = _audioContext.decodeAudioData(wav).then(value => {
        middt[insertIndex] = {
          audioBuffer: value,
          keymap: sound.keymap,
          instrumentVolume,
          soundVolume: sound.sampleVolume,
        };
      });
      promises.push(prom);
    }
  }

  const activeSourceNodes: any[] = [];

  const player = new MidiPlayer.Player(function(event: any) {
    //console.log(event);

    if (event.channel && event.track && event.channel !== event.track) {
      console.log(`Saw channel ${event.channel} and track ${event.track}`);
    }

    if (event.name === "Note on") {
      const track = event.track - 1;
      if (!midiData[track]) {
        console.warn(`Track ${track} is unrecongized`);
        return;
      }

      if (!activeSourceNodes[track]) {
        activeSourceNodes[track] = {};
      }

      const sampleInfo = findSampleToPlay(midiData[track], event.noteNumber);
      if (!sampleInfo) {
        console.warn(`No note for track ${track} note number ${event.noteNumber}`);
        return;
      }

      const playingNode = activeSourceNodes[track][event.noteNumber];
      if (!event.velocity) {
        if (playingNode) {
          playingNode.stop();
        }
        else {
          console.warn(`There wasn't a node to stop playing for ${track} note number ${event.noteNumber}`);
        }
        activeSourceNodes[track][event.noteNumber] = null;
      }
      else {
        if (playingNode) {
          console.warn(`There was a previous node playing for ${track} note number ${event.noteNumber}`);
        }

        const newPlayingNode = createAudioNode(sampleInfo, event.noteNumber, event.velocity);
        newPlayingNode.start(0);
        activeSourceNodes[track][event.noteNumber] = newPlayingNode;
      }
    }
    else {
      console.log(`Ignored event`, event);
    }
  });
  player.on("endOfFile", function() {
    _playing = false;
  });
  player.loadArrayBuffer(midi);

  Promise.all(promises).then(() => {
    console.log(midiData);
    player.play();
  });

  return new AudioPlayerController(player);
}

export class AudioPlayerController {
  private _player: MidiPlayer.Player;
  private _onFinishedCallbacks: Function[];

  public constructor(player: MidiPlayer.Player) {
    this._player = player;
    this._onFinishedCallbacks = [];

    this._player.on("endOfFile", () => {
      this._onFinishedCallbacks.forEach(callback => callback());
    });
  }

  stop() {
    if (this._player) {
      this._player.stop();
      _playing = false;
      this._onFinishedCallbacks.forEach(callback => callback());
    }
  }

  addOnFinished(callback: () => void) {
    this._onFinishedCallbacks.push(callback);
  }
}

type SampleInfo = {
  audioBuffer: AudioBuffer,
  keymap: ALKeyMap,
  instrumentVolume: number,
  soundVolume: number,
};

function findSampleToPlay(infos: SampleInfo[], noteNumber: number): SampleInfo | null {
  for (const info of infos) {
    if (noteNumber >= info.keymap.keyMin && noteNumber <= info.keymap.keyMax) {
      return info;
    }
  }
  return null;
}

const VELOCITY_MAX = 0x7F;

function createAudioNode(
  sampleInfo: SampleInfo,
  targetNoteNumber: number,
  targetVelocity: number
): AudioBufferSourceNode {
  const node = _audioContext.createBufferSource();
  node.buffer = sampleInfo.audioBuffer;
  node.detune.value = sampleInfo.keymap.detune;

  if (targetNoteNumber !== sampleInfo.keymap.keyBase) {
    const semiToneAdjust = targetNoteNumber - sampleInfo.keymap.keyBase;
    const centsAdjust = semiToneAdjust * 100;
    node.detune.value += centsAdjust;
  }

  // if (targetNoteNumber !== sampleInfo.keymap.keyBase) {
  //   const psNode = PitchShift(_audioContext);
  //   psNode.connect(_audioContext.destination);
  //   psNode.transpose = targetNoteNumber - sampleInfo.keymap.keyBase;
  //   psNode.wet.value = 1;
  //   psNode.dry.value = 0.5;

  //   node.connect(psNode);
  // }

  const gainNode = _audioContext.createGain()
  gainNode.gain.value = sampleInfo.instrumentVolume / VELOCITY_MAX;
  gainNode.gain.value *= (sampleInfo.soundVolume / VELOCITY_MAX);
  gainNode.gain.value *= (targetVelocity / VELOCITY_MAX);

  gainNode.connect(_audioContext.destination);
  node.connect(gainNode);

  return node;
}
