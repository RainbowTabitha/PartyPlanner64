PP64.ns("patches");

PP64.patches.PatchView = (function() {
  class PatchView extends React.Component {
    state = {}

    render() {
      let patches = PP64.patches.getPatches(PP64.romhandler.getROMGame());
      let entries = patches.map(patch => {
        return (
          <PatchEntry key={patch.id} patch={patch} />
        );
      });
      if (!entries.length) {
        entries = (
          <p>Sorry, no patches are available for this ROM.</p>
        );
      }
      return (
        <div id="patchesView">
          <h3>Patches</h3>
          {entries}
        </div>
      );
    }
  };

  class PatchEntry extends React.Component {
    state = {
      applied: false
    }

    render() {
      let btnText = this.state.applied ? "\u2713" : "Apply";
      return (
        <div className="patchEntry">
          <button className="patchBtn" onClick={this.applyPatch}>{btnText}</button>
          <div className="patchText">
            <span className="patchName">{this.props.patch.name}</span>
            <br />
            <span className="patchDesc">{this.props.patch.desc}</span>
          </div>
        </div>
      );
    }

    applyPatch = () => {
      let romView = PP64.romhandler.getDataView();
      let game = PP64.romhandler.getROMGame();
      let patch = this.props.patch;
      patch.apply(romView, game);
      this.setState({ applied: true });
      $$log(`Applied patch ${patch.id}.`);
    }
  };

  return PatchView;
})();
