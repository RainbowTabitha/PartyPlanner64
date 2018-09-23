PP64.ns("utils");

// The advanced "dump" feature packs all of the individual filesystem
// contents into a zip file. You can edit the zipped contents and import them,
// and your changes will be blindly applied to the ROM.
PP64.utils.dump = class Dump {
  static create(callback) {
    let zip = new JSZip();

    let mainfs = zip.folder("mainfs");
    let mainfsDirCount = PP64.fs.mainfs.getDirectoryCount();
    for (let d = 0; d < mainfsDirCount; d++) {
      let dirFolder = mainfs.folder(d.toString());
      let dirFileCount = PP64.fs.mainfs.getFileCount(d);
      for (let f = 0; f < dirFileCount; f++) {
        let file = PP64.fs.mainfs.get(d, f);
        let name = f.toString();
        if (PP64.utils.FORM.isForm(file))
          name += ".form";
        else if (PP64.utils.MTNX.isMtnx(file))
          name += ".mtnx";
        dirFolder.file(name, file);
      }
    }

    zip.generateAsync({type: "blob"}).then(callback);
  }

  static load(buffer) {
    let zip = new JSZip();
    zip.loadAsync(buffer).then(zip => {
      let mainfs = zip.folder("mainfs");
      mainfs.forEach((relativePath, file) => {
        let dirFileRegex = /(\d+)\/(\d+)/;
        let match = relativePath.match(dirFileRegex);
        if (!match)
          return;
        let d = parseInt(match[1]);
        let f = parseInt(match[2]);
        if (isNaN(d) || isNaN(f))
          return;
        file.async("arraybuffer").then(content => {
          $$log(`Overwriting MainFS ${d}/${f}`);
          PP64.fs.mainfs.write(d, f, content);
        });
      });
    }, error => {
      $$log(error);
      PP64.app.showMessage(`Something went wrong while loading the zip. ${error}`);
    });
  }

  // Called via console PP64.utils.dump.images();
  static images() {
    let zip = new JSZip();

    let mainfs = zip.folder("mainfs");
    let mainfsDirCount = PP64.fs.mainfs.getDirectoryCount();
    for (let d = 0; d < mainfsDirCount; d++) {
      let dirFolder = mainfs.folder(d.toString());
      let dirFileCount = PP64.fs.mainfs.getFileCount(d);
      for (let f = 0; f < dirFileCount; f++) {
        try {
          let fileBuffer = PP64.fs.mainfs.get(d, f);
          if (PP64.utils.FORM.isForm(fileBuffer)) {
            let formUnpacked = PP64.utils.FORM.unpack(fileBuffer);
            if (formUnpacked.BMP1.length) {
              formUnpacked.BMP1.forEach((bmpEntry, idx) => {
                let dataUri = PP64.utils.arrays.arrayBufferToDataURL(bmpEntry.parsed.src, bmpEntry.parsed.width, bmpEntry.parsed.height);
                dirFolder.file(`${f}.${idx}.png`, dataUri.substr(dataUri.indexOf(',') + 1), { base64: true });
              });
            }
          }
          else {
            // Maybe an ImgPack?
            let imgs = _readImgsFromMainFS(d, f);
            imgs.forEach((imgInfo, idx) => {
              let dataUri = PP64.utils.arrays.arrayBufferToDataURL(imgInfo.src, imgInfo.width, imgInfo.height);
              dirFolder.file(`${f}.${idx}.png`, dataUri.substr(dataUri.indexOf(',') + 1), { base64: true });
            });
            if (imgs.length > 1) {
              let tilesBuf = PP64.utils.img.tiler.fromTiles(_readPackedFromMainFS(d, f), imgs.length, 1, imgs[0].width * 4, imgs[0].height);
              let tilesUrl = PP64.utils.arrays.arrayBufferToDataURL(tilesBuf, imgs[0].width * imgs.length, imgs[0].height);
              dirFolder.file(`${f}.all.png`, tilesUrl.substr(tilesUrl.indexOf(',') + 1), { base64: true });
            }
          }
        }
        catch (e) {}
      }
    }

    zip.generateAsync({type: "blob"}).then((blob) => {
      saveAs(blob, `mp${PP64.romhandler.getGameVersion()}-images.zip`);
    });

    function _readPackedFromMainFS(dir, file) {
      let imgPackBuffer = PP64.fs.mainfs.get(dir, file);
      let imgArr = PP64.utils.img.ImgPack.fromPack(imgPackBuffer);
      if (!imgArr || !imgArr.length)
        return;

      let dataViews = imgArr.map(imgInfo => {
        return new DataView(imgInfo.src);
      });

      return dataViews;
    }

    function _readImgsFromMainFS(dir, file) {
      let imgPackBuffer = PP64.fs.mainfs.get(dir, file);
      let imgArr = PP64.utils.img.ImgPack.fromPack(imgPackBuffer);
      if (!imgArr || !imgArr.length)
        return;

      return imgArr;
    }
  }

  // Dump out all the FORM bitmaps.
  static formImages() {
    let mainfsDirCount = PP64.fs.mainfs.getDirectoryCount();
    for (let d = 0; d < mainfsDirCount; d++) {
      let dirFileCount = PP64.fs.mainfs.getFileCount(d);
      for (let f = 0; f < dirFileCount; f++) {
        let fileBuffer = PP64.fs.mainfs.get(d, f);
        if (!PP64.utils.FORM.isForm(fileBuffer))
          continue;

        try {
          let formUnpacked = PP64.utils.FORM.unpack(fileBuffer);
          if (formUnpacked.BMP1.length) {
            formUnpacked.BMP1.forEach(bmpEntry => {
              let dataUri = PP64.utils.arrays.arrayBufferToDataURL(bmpEntry.parsed.src, bmpEntry.parsed.width, bmpEntry.parsed.height);
              console.log(`${d}/${f}:`);
              console.log(dataUri);
            });
          }
        }
        catch (e) {}
      }
    }
  }

  static strings3(searchStr = "", raw = false) {
    let dirCount = PP64.fs.strings3.getDirectoryCount("en");
    for (let d = 0; d < dirCount; d++) {
      let strCount = PP64.fs.strings3.getStringCount("en", d);
      for (let s = 0; s < strCount; s++) {
        let str = PP64.fs.strings3.read("en", d, s);
        if (str.indexOf(searchStr) < 0)
          continue;
        let log = `${d}/${s}:\n` + str;
        if (raw)
          log += "\n" + PP64.utils.arrays.toHexString(PP64.fs.strings3.read("en", d, s, true));
        console.log(log);
      }
    }
  }

  static strings(searchStr = "", raw = false) {
    let strCount = PP64.fs.strings.getStringCount();
    for (let s = 0; s < strCount; s++) {
      let str = PP64.fs.strings.read(s);
      if (str.indexOf(searchStr) < 0)
        continue;
      let log = `${s}:\n` + str;
      if (raw)
        log += "\n" + PP64.utils.arrays.toHexString(PP64.fs.strings.read(s, true));
      console.log(log);
    }
  }

  static saveWaluigi() {
    if (PP64.romhandler.getGameVersion() !== 3)
      throw `Waluigi is not in game ${PP64.romhandler.getGameVersion()}`;

    window.waluigiParts = [];
    for (let f = 0; f < 163; f++) {
      window.waluigiParts.push(PP64.fs.mainfs.get(8, f));
    }

    return window.waluigiParts; // Just to see in console.
  }

  static writeWaluigi(character = 1) {
    if (PP64.romhandler.getGameVersion() !== 1)
      throw `Waluigi cannot write to MP${PP64.romhandler.getGameVersion()}`;

    if (!window.waluigiParts)
      throw "Need to call saveWaluigi first!";

    if (window.waluigiParts.length === 163) {
      // A couple animations are "extra"... not sure which but for now just cut the last two MTNX
      window.waluigiParts.splice(158, 2);
    }

    for (let i = 0; i < window.waluigiParts.length; i++) {
      PP64.fs.mainfs.write(character, i, window.waluigiParts[i]);
    }
  }

  static saveDaisy() {
    if (PP64.romhandler.getGameVersion() !== 3)
      throw `Daisy is not in game ${PP64.romhandler.getGameVersion()}`;

    window.daisyParts = [];
    window.daisyParts.push(PP64.fs.mainfs.get(9, 1));
    window.daisyParts.push(PP64.fs.mainfs.get(9, 3));

    return window.daisyParts; // Just to see in console.
  }

  static writeDaisy(character = 6) {
    if (PP64.romhandler.getGameVersion() !== 1)
      throw `Daisy cannot write to MP${PP64.romhandler.getGameVersion()}`;

    if (!window.daisyParts)
      throw "Need to call saveDaisy first!";

    PP64.fs.mainfs.write(character, 158, window.daisyParts[0]);
    PP64.fs.mainfs.write(character, 159, window.daisyParts[1]);
  }

  // Helper for finding FS read locations
  static searchForPatchLocations(offset) {
    if (!offset) throw "Please pass a ROM offset the game tries to read at runtime";

    let upper = (offset & 0xFFFF0000) >>> 16;
    let lower = offset & 0x0000FFFF;

    let found = 0;

    let romView = PP64.romhandler.getDataView();
    let upperLimit = romView.byteLength - 10; // Since we read ahead for every i, just stop early.
    for (let i = 2; i < upperLimit; i += 2) {
      let val = romView.getUint16(i);
      if (val !== upper && (val + 1) !== upper && (val - 1) !== upper) // Desperate times call for desperate measures (and I forget which way to +-1)
        continue;

      let last = 0;
      if ( (i > 8 && romView.getUint16((last = i - 8)) === lower)
        || (i > 4 && romView.getUint16((last = i - 4)) === lower)
        || romView.getUint16((last = i + 2)) === lower // === offset basically
        || romView.getUint16((last = i + 3)) === lower // Odd are unlikely unless compressed
        || romView.getUint16((last = i + 4)) === lower
        || romView.getUint16((last = i + 5)) === lower
        || romView.getUint16((last = i + 6)) === lower
        || romView.getUint16((last = i + 7)) === lower
        || romView.getUint16((last = i + 8)) === lower
        || romView.getUint16((last = i + 9)) === lower
        || romView.getUint16((last = i + 10)) === lower
        || romView.getUint16((last = i + 12)) === lower
        || romView.getUint16((last = i + 16)) === lower
        || romView.getUint16((last = i + 20)) === lower)
      {
        console.log(`Found ${$$hex(i)}, ${$$hex(last)} (${last - i}) Lower inst: ${$$hex(romView.getUint16(last - 2))}`);
        found++;
      }
    }

    console.log(`Found ${found} possible locations`);
  }

  static printSceneTable() {
    const adapter = PP64.adapters.getROMAdapter();
    if (!(adapter && adapter.SCENE_TABLE_ROM)) {
      console.log("ROM is not loaded, or scene table location is unknown");
      return;
    }

    const sceneCount = PP64.fs.scenes.count();
    const table = [];
    for (let i = 0; i < sceneCount; i++) {
      const info = PP64.fs.scenes.getInfo(i);
      table.push({
        i: $$hex(i),
        rom_start: $$hex(info.rom_start),
        rom_end: $$hex(info.rom_end),
        //ram_start: $$hex(),
        code_start: $$hex(info.code_start),
        //code_end: $$hex(),
        rodata_start: $$hex(info.rodata_start),
        //rodata_end: $$hex(),
        bss_start: $$hex(info.bss_start),
        bss_end: $$hex(info.bss_end),
      });
    }

    console.table(table);
  }

  /** Prints the overlay table in n64split format. */
  static printSceneN64Split() {
    const adapter = PP64.adapters.getROMAdapter();
    if (!(adapter && adapter.SCENE_TABLE_ROM)) {
      console.log("ROM is not loaded, or scene table location is unknown");
      return;
    }

    const sceneCount = PP64.fs.scenes.count();
    const strings = [];
    for (let i = 0; i < sceneCount; i++) {
      const info = PP64.fs.scenes.getInfo(i);

      strings.push(`   - [${$$hex(info.rom_start)}, ${$$hex(info.rom_start + (info.code_end - info.code_start))}, "asm", "overlay${i}_main", ${$$hex(info.code_start)}]`);
      strings.push(`   - [${$$hex(info.rom_start + (info.rodata_start - info.code_start))}, ${$$hex(info.rom_start + (info.rodata_end - info.code_start))}, "bin", "overlay${i}_rodata_bin"]`);
      strings.push(`   # overlay${i} bss: ${$$hex(info.bss_start)} - ${$$hex(info.bss_end)}`);
    }

    console.log(strings.join("\n"));
  }

  // Prints region of ROM as assembly instructions
  static printAsm(start, end) {
    let romView = PP64.romhandler.getDataView();
    let curOffset = start;
    let insts = [];
    while (curOffset <= end) {
      let value = romView.getUint32(curOffset);
      let asm = "? " + $$hex(value);
      try {
        asm = MIPSInst.print(value);
      }
      catch(e) {
        console.log("UNRECOGNIZED: " + $$hex(value));
      }
      insts.push($$hex(curOffset) + ": " + asm);
      curOffset += 4;
    }

    console.log(insts.join("\n"));
  }

  /**
   * Prints the assembly from an overlay.
   * @param {number} sceneIndex
   */
  static printSceneAsm(sceneIndex) {
    const sceneInfo = PP64.fs.scenes.getInfo(sceneIndex);
    let currentAsmAddr = sceneInfo.code_start;
    const codeDataView = PP64.fs.scenes.getCodeDataView(sceneIndex);
    const insts = [];
    for (let i = 0; i < codeDataView.byteLength; i += 4) {
      const value = codeDataView.getUint32(i);
      let asm = "? " + $$hex(value);
      try {
        asm = MIPSInst.print(value);
      }
      catch(e) {
        console.log("UNRECOGNIZED: " + $$hex(value));
      }
      insts.push($$hex(currentAsmAddr) + ": " + asm);
      currentAsmAddr += 4;
    }

    console.log(insts.join("\n"));

    const roDataView = PP64.fs.scenes.getRoDataView(sceneIndex);
    const lines = [];
    currentAsmAddr = sceneInfo.rodata_start;
    let i = 0;
    while (i < roDataView.byteLength) {
      lines.push($$hex(currentAsmAddr)
      + ": " + PP64.utils.string.pad($$hex(roDataView.getUint32(i), ""), 8, "0")
      + " " + PP64.utils.string.pad($$hex(roDataView.getUint32(i + 4), ""), 8, "0")
      + " " + PP64.utils.string.pad($$hex(roDataView.getUint32(i + 8), ""), 8, "0")
      + " " + PP64.utils.string.pad($$hex(roDataView.getUint32(i + 12), ""), 8, "0"));
      currentAsmAddr += 16;
      i += 16;
    }

    console.log(lines.join("\n"));
  }
}
