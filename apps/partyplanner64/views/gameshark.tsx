import { romSupportsCheats } from "../../../packages/lib/patches/gameshark/hook";
import * as React from "react";
import { Parser } from "../../../packages/lib/patches/gameshark/parser";
import { Compiler } from "../../../packages/lib/patches/gameshark/compiler";
import { showMessage } from "../appControl";
import { currentCheats } from "../../../packages/lib/patches/gameshark/cheats";

import "../css/patches.scss";

// Example: show mem meter mp1 8105E418 2400

export class GamesharkView extends React.Component {
  private inputEl: HTMLTextAreaElement | null = null;

  state = {
    showApplied: false,
  };

  render() {
    const supported = romSupportsCheats();

    let appliedText;
    if (this.state.showApplied) {
      appliedText = <span className="gsApplied">Applied!</span>;
    }
    return (
      <div id="gamesharkView">
        <h3>Gameshark Cheats</h3>
        {!supported && (
          <p>Embeddable Gameshark cheats are not supported with this ROM.</p>
        )}
        {supported && (
          <>
            <p>Paste cheats in the box below to embed them in the ROM.</p>
            <textarea
              ref={(el) => {
                this.inputEl = el;
              }}
              rows={10}
            ></textarea>
            <button className="patchBtn" onClick={this.applyCheat}>
              Apply
            </button>
            {appliedText}
          </>
        )}
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
  };
}
