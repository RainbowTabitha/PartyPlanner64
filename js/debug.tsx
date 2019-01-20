import * as React from "react";
import { Button } from "./controls";
import { openFile } from "./utils/input";
import { blockUI } from "./appControl";
import { romhandler } from "./romhandler";
import {
  images, load as loadDump,
  create as createDump,
  formImages,
  printSceneTable,
  printSceneN64Split,
  printSceneAsm
} from "./utils/dump";
import { scenes } from "./fs/scenes";
import { $$hex } from "./utils/debug";

export const DebugView = class DebugView extends React.Component {
  state = {
    printSceneAsmNumber: "",
    romToRamNumber: "",
    romToRamResult: "",
  }

  render() {
    const romLoaded = !!romhandler.getROMBuffer();

    let romFeatures;
    if (romLoaded) {
      romFeatures = (
        <>
          <Button onClick={onImportFileDumpClick}>Import file dump</Button>
          <Button onClick={onExportFileDumpClick}>Export file dump</Button>
          <br /><br />

          <Button onClick={images}>Dump images</Button>
          <Button onClick={formImages}>Print FORM images (console)</Button>
          <br /><br />

          <Button onClick={printSceneTable}>Print scene table (console)</Button>
          <Button onClick={printSceneN64Split}>Print scene table n64split (console)</Button>
          <br /><br />

          <input type="text" placeholder="ROM Offset" className="dbInputShort"
            value={this.state.romToRamNumber}
            onChange={e => this.setState({ romToRamNumber: e.target.value, romToRamResult: "" })}
          />
          <Button onClick={this.onRomToRamClick}>ROM -> RAM</Button>
          <br />
          <span className="dbMonospace">{this.state.romToRamResult}</span>
          <br /><br />

          <input type="text" placeholder="Scene number" className="dbInputShort"
            value={this.state.printSceneAsmNumber}
            onChange={e => this.setState({ printSceneAsmNumber: e.target.value })}
          />
          <Button onClick={this.onPrintSceneAsmClick}>Print scene assembly (console)</Button>
        </>
      );
    }

    return (
      <div id="debugView">
        <h3>Debug Functionality</h3>

        {!romLoaded && <p>Load a ROM to access more functionality here.</p>}

        {romFeatures}
      </div>
    );
  }

  onPrintSceneAsmClick = () => {
    const num = parseInt(this.state.printSceneAsmNumber);
    if (!isNaN(num)) {
      printSceneAsm(num);
    }
  }

  onRomToRamClick = () => {
    let result = "";
    const num = parseInt(this.state.romToRamNumber, 16);
    if (!isNaN(num)) {
      const sceneCount = scenes.count();
      for (let i = 0; i < sceneCount; i++) {
        const info = scenes.getInfo(i);
        if (info.rom_start <= num && num <= info.rom_end) {
          const diff = num - info.rom_start;
          result = `RAM: ${$$hex(info.ram_start + diff, "")}\n`;
          result += `Overlay ${i} (${$$hex(i)}) offset +${diff} (+${$$hex(diff)})`;
        }
      }

      if (!result) {
        if (num >= 0x1000) {
          result = `RAM: ${$$hex(((num - 0xC00) | 0x80000000) >>> 0)}`
        }
      }
    }
    if (result) {
      this.setState({ romToRamResult: result });
    }
    else {
      this.setState({ romToRamResult: "Unknown" });
    }
  }
}

function onImportFileDumpClick() {
  openFile(".zip", dumpSelected);
}

function dumpSelected(event: any) {
  let file = event.target.files[0];
  if (!file)
    return;

  let reader = new FileReader();
  reader.onload = error => {
    // Extract the dump and replace ROM files.
    loadDump(reader.result as ArrayBuffer);
  };
  reader.readAsArrayBuffer(file);
}

function onExportFileDumpClick() {
  blockUI(true);
  createDump(dumpCreated);
}

function dumpCreated(blob: Blob) {
  saveAs(blob, `mp${romhandler.getGameVersion()}-files.zip`);
  blockUI(false);
}
