let _audioContext: AudioContext;
let _playing = false;

export function getAudioContext(): AudioContext {
  if (!_audioContext) {
    _audioContext = new AudioContext();
  }
  return _audioContext;
}

export function getIsPlaying(): boolean {
  return _playing;
}

export function setIsPlaying(playing: boolean): void {
  _playing = playing;
}

export interface IAudioPlayer {
  on(...aargs: any[]): void;
  stop(): void;
}

export class AudioPlayerController {
  private _player: IAudioPlayer;
  private _onFinishedCallbacks: VoidFunction[];

  public constructor(player: IAudioPlayer) {
    this._player = player;
    this._onFinishedCallbacks = [];

    this._player.on("endOfFile", () => {
      this._onFinishedCallbacks.forEach((callback) => callback());
    });
  }

  stop() {
    if (this._player) {
      this._player.stop();
      setIsPlaying(false);
      this._onFinishedCallbacks.forEach((callback) => callback());
    }
  }

  addOnFinished(callback: VoidFunction) {
    this._onFinishedCallbacks.push(callback);
  }
}
