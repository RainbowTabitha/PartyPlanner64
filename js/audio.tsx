import React = require("react");
import { romhandler } from "./romhandler";
import { audio } from "./fs/audio";
import { getAdapter } from "./adapter/adapters";
import { playMidi, AudioPlayerController } from "./audio/player";

interface IAudioViewerState {
  hasError: boolean;
  playbackController?: AudioPlayerController | null;
  playing: false | [number, number];
}

export class AudioViewer extends React.Component<{}, IAudioViewerState> {
  constructor(props: {}) {
    super(props);

    this.state = {
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

    let game = romhandler.getGameVersion();
    if (game !== 1)
      return null;

    const adapter = getAdapter(game)!;
    const names = adapter.getAudioMap();

    let rows = [];

    const sequenceTableCount = audio.getSequenceTableCount();
    for (let t = 0; t < sequenceTableCount; t++) {
      if (t > 0) {
        rows.push(
          <tr key={t + "hr"}>
            <td colSpan={2}><hr /></td>
          </tr>
        );
      }

      const s2 = audio.getSequenceTable(t)!;
      for (let s = 0; s < s2.midis.length; s++) {
        let isPlaying: boolean = false;
        let cannotPlay: boolean = false;
        if (this.state.playing) {
          isPlaying = t === this.state.playing[0] && s === this.state.playing[1];
          cannotPlay = !isPlaying;
        }

        rows.push(
          <AudioTrackRow key={t + "-" + s}
            table={t} index={s}
            isPlaying={isPlaying}
            cannotPlay={cannotPlay}
            trackName={names[s] || "(none)"}
            onPlay={this.onPlay}
            onStop={this.onStop} />
        );
      }
    }

    return (
      <div className="audioViewContainer">
        <h2>Audio</h2>
        <p>This is an experimental audio player.</p>
        <AudioEntryTable listing={rows} />
      </div>
    );
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ hasError: true });
    console.error(error);
  }

  onPlay = (table: number, index: number) => {
    const controller = playMidi(table, index);
    controller.addOnFinished(() => {
      this.setState({
        playbackController: null,
        playing: false,
      });
    });
    this.setState({
      playbackController: controller,
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
        {playbackControls}
      </tr>
    );
  }
}
