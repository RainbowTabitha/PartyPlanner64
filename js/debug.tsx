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

export const DebugView = class DebugView extends React.Component {
  state = {
    printSceneAsmNumber: "",
  }

  render() {
    const romLoaded = !!romhandler.getROMBuffer();
    return (
      <div id="debugView">
        <h3>Debug Functionality</h3>

        {romLoaded && <Button onClick={onImportFileDumpClick}>Import file dump</Button>}
        {romLoaded && <Button onClick={onExportFileDumpClick}>Export file dump</Button>}
        <br /><br />
        {romLoaded && <Button onClick={images}>Dump images</Button>}
        {romLoaded && <Button onClick={formImages}>Print FORM images (console)</Button>}
        <br /><br />
        {romLoaded && <Button onClick={printSceneTable}>Print scene table (console)</Button>}
        {romLoaded && <Button onClick={printSceneN64Split}>Print scene table n64split (console)</Button>}
        <br /><br />
        {romLoaded && <>
          <input type="text" placeholder="Scene number" className="dbInputShort"
            value={this.state.printSceneAsmNumber}
            onChange={e => this.setState({ printSceneAsmNumber: e.target.value })}
          />
          <Button onClick={this.onPrintSceneAsmClick}>Print scene assembly (console)</Button>
        </>}
      </div>
    );
  }

  onPrintSceneAsmClick = () => {
    const num = parseInt(this.state.printSceneAsmNumber);
    if (!isNaN(num)) {
      printSceneAsm(num);
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
