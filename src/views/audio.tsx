import * as React from "react";
import { romhandler } from "../romhandler";
import { audio } from "../fs/audio";
import { getAdapter } from "../adapter/adapters";
import { playMidi } from "../audio/midiplayer";
import { Button } from "../controls";
import { parseGameMidi } from "../audio/midi";
import { playSound } from "../audio/soundplayer";
import { AudioPlayerController } from "../audio/playershared";
import { extractWavFromSound } from "../audio/wav";
import { $setting, get } from "./settings";
import { saveAs } from "file-saver";

import exportImage from "../img/audio/export.png";
import stopImage from "../img/audio/stop.png";
import playImage from "../img/audio/play.png";

interface IAudioViewerState {
  hasError: boolean;
  playbackController?: AudioPlayerController | null;
  playingType: "none" | "midi" | "sound";
  playing: false | [number, number];
}

export class AudioViewer extends React.Component<{}, IAudioViewerState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      playingType: "none",
      hasError: false,
      playing: false,
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p>An error was encountered.</p>
      );
    }

    const game = romhandler.getGameVersion()!;
    const adapter = getAdapter(game)!;
    const trackNames = adapter.getAudioMap();

    const advancedSetting = get($setting.uiAdvanced);

    let sequenceRows = [];
    const sequenceTableCount = audio.getSequenceTableCount();
    for (let t = 0; t < sequenceTableCount; t++) {
      if (t > 0) {
        sequenceRows.push(
          <tr key={t + "hr"}>
            <td colSpan={2}><hr /></td>
          </tr>
        );
      }

      const table = audio.getSequenceTable(t)!;
      for (let s = 0; s < table.midis.length; s++) {
        let isPlaying: boolean = false;
        let cannotPlay: boolean = false;
        if (this.state.playing) {
          isPlaying = t === this.state.playing[0] && s === this.state.playing[1]
            && this.state.playingType === "midi";
          cannotPlay = !isPlaying;
        }

        let trackName;
        const soundName = trackNames[s];
        const index = `${s}, 0x${s.toString(16).toUpperCase()}`;
        if (soundName) {
          trackName = <span title={index}>
            {soundName}
            {advancedSetting &&
              <span className="audioIndexBesideName">{` (${index})`}</span>
            }
          </span>;
        }
        else {
          trackName = <span title={index}>
            {index}
          </span>;
        }

        sequenceRows.push(
          <AudioTrackRow key={t + "-" + s}
            table={t} index={s}
            isPlaying={isPlaying}
            cannotPlay={cannotPlay}
            trackName={trackName}
            onPlay={this.onPlayMidi}
            onStop={this.onStop}
            exportButton={
              <Button onClick={() => _exportMidi(t, s, soundName || "Unknown")}
                css="btnAudioExport">
                <img src={exportImage} height="16" width="16" alt="Export" />
                midi
              </Button>
            } />
        );
      }
    }

    let soundRows = [];
    const soundTableCount = audio.getSoundTableCount();
    for (let t = 0; t < soundTableCount; t++) {
      if (t > 0) {
        soundRows.push(
          <tr key={t + "-s-hr"}>
            <td colSpan={2}><hr /></td>
          </tr>
        );
      }

      const table = audio.getSoundTable(t)!;
      const soundEffectNames = adapter.getSoundEffectMap(t);
      for (let s = 0; s < table.sounds.length; s++) {
        let isPlaying: boolean = false;
        let cannotPlay: boolean = false;
        if (this.state.playing) {
          isPlaying = t === this.state.playing[0] && s === this.state.playing[1]
            && this.state.playingType === "sound";
          cannotPlay = !isPlaying;
        }

        let trackName;
        const effectName = soundEffectNames[s];
        const index = `${s}, 0x${s.toString(16).toUpperCase()}`;
        if (effectName) {
          trackName = <span title={index}>
            {effectName}
            {advancedSetting &&
              <span className="audioIndexBesideName">{` (${index})`}</span>
            }
          </span>;
        }
        else {
          trackName = <span title={index}>
            {index}
          </span>;
        }

        const downloadName = effectName ? effectName : `${s}`;

        soundRows.push(
          <AudioTrackRow key={t + "-s-" + s}
            table={t} index={s}
            isPlaying={isPlaying}
            cannotPlay={cannotPlay}
            trackName={trackName}
            onPlay={this.onPlaySound}
            onStop={this.onStop}
            exportButton={
              <Button onClick={() => _exportWav(t, s, downloadName)}
                css="btnAudioExport">
                <img src={exportImage} height="16" width="16" alt="Export" />
                wav
              </Button>
            } />
        );
      }
    }

    return (
      <div className="audioViewContainer">
        <h2>Audio</h2>
        <p>This is an experimental audio player.</p>
        <h3>Sound Tracks</h3>
        <AudioEntryTable listing={sequenceRows} />
        <h3>Sound Effects</h3>
        <AudioEntryTable listing={soundRows} />
      </div>
    );
  }

  componentWillUnmount() {
    if (this.state.playbackController) {
      this.state.playbackController.stop();
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ hasError: true });
    console.error(error);
  }

  onPlayMidi = (table: number, index: number) => {
    const controller = playMidi(table, index);
    controller.addOnFinished(() => {
      this.setState({
        playbackController: null,
        playing: false,
      });
    });
    this.setState({
      playbackController: controller,
      playingType: "midi",
      playing: [table, index],
    });
  }

  onPlaySound = (table: number, index: number) => {
    const controller = playSound(table, index);
    controller.addOnFinished(() => {
      this.setState({
        playbackController: null,
        playing: false,
      });
    });
    this.setState({
      playbackController: controller,
      playingType: "sound",
      playing: [table, index],
    });
  }

  onStop = (table: number, index: number) => {
    if (this.state.playbackController) {
      this.state.playbackController.stop();
    }
  }
}

interface IAudioTrackRowProps {
  table: number;
  index: number;
  trackName: any;
  isPlaying: boolean;
  cannotPlay: boolean;
  exportButton?: any;
  onPlay(table: number, index: number): void;
  onStop(table: number, index: number): void;
}

function AudioEntryTable(props: { listing: any }) {
  return (
    <table className="audioViewTable">
      {Array.isArray(props.listing) ? (
        <thead>
          <tr>
            <th></th>
            <th className="audioViewTableIconColumn"></th>
          </tr>
        </thead>
      ) : null }
      <tbody>
        {props.listing}
      </tbody>
    </table>
  )
}

class AudioTrackRow extends React.Component<IAudioTrackRowProps> {
  render() {
    let playbackControls = <td></td>;
    if (this.props.isPlaying) {
      playbackControls = (
        <td>
          <img src={stopImage}
            alt="Stop audio" title="Stop audio"
            onClick={() => this.props.onStop(this.props.table, this.props.index)} />
        </td>
      );
    }
    else {
      const iconCssClass = this.props.cannotPlay ? "audioRowIconNoAction" : "";
      playbackControls = (
        <td>
          <img src={playImage}
            alt="Play audio" title="Play audio"
            className={iconCssClass}
            onClick={() => {
              if (this.props.cannotPlay)
                return;
              this.props.onPlay(this.props.table, this.props.index);
            }} />
        </td>
      );
    }

    return (
      <tr className="audioTableRow">
        <td>{this.props.trackName}</td>
        {this.props.exportButton && <td>
          {this.props.exportButton}
        </td>}
        {playbackControls}
      </tr>
    );
  }
}

function _exportMidi(table: number, index: number, name?: string): void {
  name = name || "music";
  const seqTable = audio.getSequenceTable(table)!;
  const gameMidiBuffer = seqTable.midis[index].buffer;
  const midi = parseGameMidi(new DataView(gameMidiBuffer), gameMidiBuffer.byteLength);
  saveAs(new Blob([midi]), `${name}.midi`);
}

function _exportWav(table: number, index: number, name?: string): void {
  name = name || "sound";
  const soundTable = audio.getSoundTable(table)!;
  const sound = soundTable.sounds[index];
  const wav = extractWavFromSound(soundTable.tbl, sound, sound.sampleRate);
  saveAs(new Blob([wav]), `${name}.wav`);
}