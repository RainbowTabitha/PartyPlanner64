PP64.ns("patches.gameshark");

PP64.patches.gameshark.reset = function() {
  PP64.patches.gameshark.currentCheats = [];
}
PP64.patches.gameshark.reset();

PP64.patches.gameshark.getCheatBuffer = function() {
  return PP64.patches.gameshark.currentCheats.reduce(PP64.utils.arrays.join);
}

// Example: show mem meter mp1 8105E418 2400

// Joins all the cheat buffers into one
// opts.endInsts - if given, an array of instructions to append
PP64.patches.gameshark.getCheatRoutineBuffer = function(opts) {
  opts = opts || {};
  const endInsts = opts.endInsts;

  const allCheatsBuffer = PP64.patches.gameshark.getCheatBuffer();

  let bufferLen = allCheatsBuffer.byteLength + (endInsts ? (endInsts.length * 4) : 0);
  const fullBuffer = new ArrayBuffer(bufferLen);
  const dataView = new DataView(fullBuffer);

  let offset = 0;

  // Write cheats
  PP64.utils.arrays.copyRange(fullBuffer, allCheatsBuffer, offset, 0, allCheatsBuffer.byteLength);
  offset += allCheatsBuffer.byteLength;

  if (endInsts) {
    for (let i = 0; i < endInsts.length; i++) {
      dataView.setUint32(offset, endInsts[i]);
      offset += 4;
    }
  }

  return fullBuffer;
}

PP64.patches.gameshark.GamesharkView = (function() {
  class GamesharkView extends React.Component {
    state = {
      showApplied: false
    }

    render() {
      let appliedText;
      if (this.state.showApplied) {
        appliedText = <span className="gsApplied">Applied!</span>;
      }
      return (
        <div id="gamesharkView">
          <h3>Cheats</h3>
          <textarea ref={(el) => { this.inputEl = el; }}></textarea>
          <button className="patchBtn" onClick={this.applyCheat}>Apply</button>
          {appliedText}
        </div>
      );
    }

    applyCheat = () => {
      const cheatText = this.inputEl.value;

      const parsedCodes = PP64.patches.gameshark.Parser.parse(cheatText);
      if (!parsedCodes) {
        PP64.app.showMessage("There was an error parsing the entered cheats");
        return;
      }

      const compiler = new PP64.patches.gameshark.Compiler();
      const codeBuffer = compiler.compile(parsedCodes);
      if (!codeBuffer) {
        PP64.app.showMessage("There was an error compiling the entered cheats");
        return;
      }

      PP64.patches.gameshark.currentCheats.push(codeBuffer);

      this.inputEl.value = "";

      this.setState({ showApplied: true });

      setTimeout(() => {
        this.setState({ showApplied: false });
      }, 3000);
    }
  };

  return GamesharkView;
})();
