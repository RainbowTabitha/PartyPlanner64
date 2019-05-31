import { romSupportsCheats } from "../patches/gameshark/hook";
import { join, copyRange } from "../utils/arrays";
import * as React from "react";
import { Parser } from "../patches/gameshark/parser";
import { Compiler } from "../patches/gameshark/compiler";
import { showMessage } from "../appControl";

export let currentCheats: ArrayBuffer[] = [];

export function reset() {
  currentCheats = [];
}
reset();

export function getCheatBuffer() {
  return currentCheats.reduce(join);
}

// Example: show mem meter mp1 8105E418 2400

// Joins all the cheat buffers into one
// opts.endInsts - if given, an array of instructions to append
export function getCheatRoutineBuffer(opts?: { endInsts?: number[] }) {
  opts = opts || {};
  const endInsts = opts.endInsts;

  const allCheatsBuffer = getCheatBuffer();

  let bufferLen = allCheatsBuffer.byteLength + (endInsts ? (endInsts.length * 4) : 0);
  const fullBuffer = new ArrayBuffer(bufferLen);
  const dataView = new DataView(fullBuffer);

  let offset = 0;

  // Write cheats
  copyRange(fullBuffer, allCheatsBuffer, offset, 0, allCheatsBuffer.byteLength);
  offset += allCheatsBuffer.byteLength;

  if (endInsts) {
    for (let i = 0; i < endInsts.length; i++) {
      dataView.setUint32(offset, endInsts[i]);
      offset += 4;
    }
  }

  return fullBuffer;
}

export class GamesharkView extends React.Component {
  private inputEl: HTMLTextAreaElement | null = null;

  state = {
    showApplied: false
  }

  render() {
    const supported = romSupportsCheats();

    let appliedText;
    if (this.state.showApplied) {
      appliedText = <span className="gsApplied">Applied!</span>;
    }
    return (
      <div id="gamesharkView">
        <h3>Gameshark Cheats</h3>
        {!supported && <p>Embeddable Gameshark cheats are not supported with this ROM.</p>}
        {supported && <>
          <p>Paste cheats in the box below to embed them in the ROM.</p>
          <textarea ref={(el) => { this.inputEl = el; }} rows={10}></textarea>
          <button className="patchBtn" onClick={this.applyCheat}>Apply</button>
          {appliedText}
        </>}
      </div>
    );
  }

  applyCheat = () => {
    const cheatText = this.inputEl!.value;

    const parsedCodes = Parser.parse(cheatText);
    if (!parsedCodes) {
      showMessage("There was an error parsing the entered cheats");
      return;
    }

    const compiler = new Compiler();
    const codeBuffer = compiler.compile(parsedCodes);
    if (!codeBuffer) {
      showMessage("There was an error compiling the entered cheats");
      return;
    }

    currentCheats.push(codeBuffer);

    this.inputEl!.value = "";

    this.setState({ showApplied: true });

    setTimeout(() => {
      this.setState({ showApplied: false });
    }, 3000);
  }
};
