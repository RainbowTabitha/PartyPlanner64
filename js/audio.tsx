import React = require("react");
import { romhandler } from "./romhandler";
import { audio } from "./fs/audio";
import { getAdapter } from "./adapter/adapters";
import { playMidi } from "./audio/midiplayer";
import { Button } from "./controls";
import { parseGameMidi } from "./audio/midi";
import { playSound } from "./audio/soundplayer";
import { AudioPlayerController } from "./audio/playershared";

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
    const names = adapter.getAudioMap();

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

        sequenceRows.push(
          <AudioTrackRow key={t + "-" + s}
            table={t} index={s}
            isPlaying={isPlaying}
            cannotPlay={cannotPlay}
            trackName={names[s] || "(none)"}
            onPlay={this.onPlayMidi}
            onStop={this.onStop} />
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
      for (let s = 0; s < table.sounds.length; s++) {
        let isPlaying: boolean = false;
        let cannotPlay: boolean = false;
        if (this.state.playing) {
          isPlaying = t === this.state.playing[0] && s === this.state.playing[1]
            && this.state.playingType === "sound";
          cannotPlay = !isPlaying;
        }

        soundRows.push(
          <AudioTrackRow key={t + "-s-" + s}
            table={t} index={s}
            isPlaying={isPlaying}
            cannotPlay={cannotPlay}
            trackName={`${s}, 0x${s.toString(16)}`}
            onPlay={this.onPlaySound}
            onStop={this.onStop} />
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
  trackName: string;
  isPlaying: boolean;
  cannotPlay: boolean;
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
          <img src="img/audio/stop.png"
            alt="Stop audio" title="Stop audio"
            onClick={() => this.props.onStop(this.props.table, this.props.index)} />
        </td>
      );
    }
    else {
      const iconCssClass = this.props.cannotPlay ? "audioRowIconNoAction" : "";
      playbackControls = (
        <td>
          <img src="img/audio/play.png"
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
        <td>
          <Button onClick={() => _exportMidi(this.props.table, this.props.index, this.props.trackName)}
            css="btnAudioExport">
            <img src="img/audio/export.png" height="16" width="16" />
            midi
          </Button>
        </td>
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
