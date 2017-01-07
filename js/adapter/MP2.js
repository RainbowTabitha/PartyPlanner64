PP64.ns("adapters");

PP64.adapters.MP2 = (function() {
  const MP2Adapter = class extends PP64.adapters.AdapterBase {
    constructor() {
      super();
      this.gameVersion = 2;

      this.nintendoLogoFSEntry = [9, 1];
      this.hudsonLogoFSEntry = [9, 2];
      this.boardDefDirectory = 10;

      this.MAINFS_READ_ADDR = 0x00017680;
      this.HEAP_FREE_ADDR = 0x00017800;
      this.TABLE_HYDRATE_ADDR = 0x0005568C;
    }

    onLoad(board, boardInfo) {
      this._extractBanks(board, boardInfo);
      this._extractItemShops(board, boardInfo);

      this._parseBoardSelectIcon(board, boardInfo);

      this._readAnimationBackgrounds(board, boardInfo);
    }

    onAfterOverwrite(romView, board, boardInfo) {
      this._writeBanks(board, boardInfo);
      this._writeItemShops(board, boardInfo);
      this._writeGates(board, boardInfo);

      // Patch game to use all 8MB.
      romView.setUint16(0x41602, 0x8040); // Main heap now starts at 0x80400000
      romView.setUint16(0x4160A, (0x00400000 - this.EVENT_MEM_SIZE) >>> 16); // ... and can fill up through reserved event space
      romView.setUint16(0x41616, 0x001A); // Temp heap fills as much as 0x1A8000 (8000 is ORed in)
      romView.setUint16(0x7869E, 0x001A);

      // Remove the animations (we might add our own after this though).
      if (!isNaN(boardInfo.animBgSet))
        PP64.adapters.animationfs.setSetEntryCount(boardInfo.animBgSet, 0);
    }

    onOverwritePromises(board, boardInfo) {
      let bgIndex = boardInfo.bgDir;
      let bgPromises = [
        this._writeBackground(bgIndex, board.bg.src, board.bg.width, board.bg.height),
        this._writeAnimationBackgrounds(boardInfo.animBgSet, board.bg.src, board.animbg, board.bg.width, board.bg.height),
        this._writeBackground(bgIndex + 2, board.otherbg.largescene, 320, 240), // Game start, end
        this._writeOverviewBackground(bgIndex + 6, board.bg.src), // Overview map
        this.onWriteBoardSelectImg(board, boardInfo), // The board select image
        this._writeBoardSelectIcon(board, boardInfo), // The board select icon
        this.onWriteBoardLogoImg(board, boardInfo), // Various board logos
        this._brandBootSplashscreen(),
      ];

      return Promise.all(bgPromises)
    }

    hydrateSpace(space) {
      if (space.type === $spaceType.BANK) {
        PP64.boards.addEventToSpace(space, PP64.adapters.events.create("BANK"));
      }
    }

    onParseStrings(board, boardInfo) {
      let strs = boardInfo.str || {};
      if (strs.boardSelect) {
        let idx = strs.boardSelect;
        // if (Array.isArray(idx))
        //   idx = idx[0];

        let str = PP64.adapters.strings.read(idx);
        let lines = str.split("\n");

        // Read the board name and description.
        let nameStart = lines[0].indexOf("}") + 1;
        let nameEnd = lines[0].indexOf("\u0019", nameStart);
        board.name = lines[0].substring(nameStart, nameEnd);
        board.description = [lines[1], lines[2]].join("\n");

        // Parse difficulty star level
        let difficulty = 0;
        let lastIndex = str.indexOf(this.getCharacterMap()[0x3B], 0);
        while (lastIndex !== -1) {
          difficulty++;
          lastIndex = str.indexOf(this.getCharacterMap()[0x3B], lastIndex + 1);
        }
        board.difficulty = difficulty;
      }
    }

    onWriteStrings(board, boardInfo) {
      let strs = boardInfo.str || {};

      // Various details about the board when selecting it
      if (strs.boardSelect) {
        let bytes = [];
        bytes.push(0x0B); // Clear?
        bytes.push(0x06); // Start BLUE
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(board.name || ""));
        bytes.push(0x19);
        bytes.push(0x04); // Start Purple?
        bytes = bytes.concat([0x0E, 0x0E]); // Tabs
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("Difficulty"));
        bytes.push(0x19);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(" : "));
        let star = 0x3B;
        if (board.difficulty > 5 || board.difficulty < 1) { // Hackers!
          bytes.push(star);
          bytes = bytes.concat(PP64.adapters.strings._strToBytes(" "));
          bytes.push(0x3E); // Little x
          bytes = bytes.concat(PP64.adapters.strings._strToBytes(" " + board.difficulty.toString()));
        }
        else {
          for (let i = 0; i < board.difficulty; i++)
            bytes.push(star);
        }
        bytes.push(0x0A); // \n
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(board.description || "")); // Assumes \n's are correct within.
        bytes.push(0x00); // Null byte

        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);

        let idx = strs.boardSelect;
        PP64.adapters.strings.write(idx, strBuffer);
      }

      // Simple strings that just have the board name
      if (strs.boardNames && strs.boardNames.length) {
        let bytes = [];
        bytes.push(0x0B);
        bytes.push(0x06);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(board.name || ""));
        bytes.push(0x19);
        bytes.push(0x00); // Null byte
        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);

        for (let i = 0; i < strs.boardNames.length; i++) {
          let idx = strs.boardNames[i];
          PP64.adapters.strings.write(idx, strBuffer);
        }
      }

      // Toad's greeting to players at start
      // One piece is pre-bowser sign, one is after
      if (strs.boardGreeting && strs.boardGreeting.length) {
        let bytes = [];
        bytes.push(0x0B);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("We're here, everyone!"));
        bytes.push(0x0A); // \n
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("This is "));
        bytes.push(0x06); // Blue
        bytes.push(0x0F);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes((board.name || "") + "!!!"));
        bytes.push(0x16);
        bytes.push(0x19);
        bytes.push(0xFF);
        // bytes.push(0x0B);
        // bytes = bytes.concat(PP64.adapters.strings._strToBytes("Your objective this time,"));
        bytes.push(0x00); // Null byte

        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);
        PP64.adapters.strings.write(strs.boardGreeting[0], strBuffer);

        bytes = [];
        bytes.push(0x0B);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("Now, before this adventure begins,"));
        bytes.push(0x0A); // \n
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("we must decide turn order."));
        bytes.push(0xFF);
        bytes.push(0x00); // Null byte

        strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);
        PP64.adapters.strings.write(strs.boardGreeting[1], strBuffer);
      }

      // String congratulating a player for winning
      if (strs.boardWinner) {
        let bytes = [];
        bytes.push(0x0B);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("Well done, "));
        bytes.push(0x11); // Player
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("!"));
        bytes.push(0x0A); // \n
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("You are the "));
        bytes.push(0x07); // Yellow
        bytes.push(0x0F);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("Super Star"));
        bytes.push(0x16);
        bytes.push(0x19);
        bytes.push(0x0A); // \n
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("of "));
        bytes.push(0x06); // Blue
        bytes.push(0x0F);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes((board.name || "") + "!!!"));
        bytes.push(0x16);
        bytes.push(0x19);
        bytes.push(0x00); // Null byte

        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);
        PP64.adapters.strings.write(strs.boardWinner, strBuffer);
      }

      // "board name   {0} Time(s)"
      if (strs.boardPlayCount) {
        let bytes = [];
        bytes.push(0x0B);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(board.name || ""));
        bytes = bytes.concat([0x0E, 0x0E, 0x0E, 0x0E, 0x0E, 0x0E]); // Tabs
        bytes.push(0x11); // Play count
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(" Time(s)"));
        bytes.push(0x00); // Null byte

        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);
        PP64.adapters.strings.write(strs.boardPlayCount, strBuffer);
      }
    }

    onChangeBoardSpaceTypesFromGameSpaceTypes(board, chains) {
      let _spaceTypes = PP64.types.Space;
      let typeMap = {
        0: _spaceTypes.OTHER, // Sometimes START
        3: _spaceTypes.OTHER,
        5: _spaceTypes.CHANCE,
        6: _spaceTypes.ITEM,
        7: _spaceTypes.BANK,
        8: _spaceTypes.OTHER,
        9: _spaceTypes.BATTLE,
        12: _spaceTypes.BOWSER,
        14: _spaceTypes.STAR,
        15: _spaceTypes.BLACKSTAR,
        16: _spaceTypes.OTHER, // Toad
        17: _spaceTypes.OTHER, // Baby Bowser the COHORT
      };
      board.spaces.forEach((space) => {
        let oldType = space.type;
        let newType = typeMap[oldType];
        if (newType !== undefined)
          space.type = newType;
      });

      if (chains.length) {
        let startSpaceIndex = chains[0][0];
        if (!isNaN(startSpaceIndex))
          board.spaces[startSpaceIndex].type = _spaceTypes.START;
      }
    }

    onChangeGameSpaceTypesFromBoardSpaceTypes(board) {
      let _spaceTypes = PP64.types.Space;
      let typeMap = {};
      typeMap[_spaceTypes.OTHER] = 0;
      typeMap[_spaceTypes.BLUE] = 1;
      typeMap[_spaceTypes.RED] = 2;
      typeMap[_spaceTypes.MINIGAME] = 0; // N/A
      typeMap[_spaceTypes.HAPPENING] = 4;
      typeMap[_spaceTypes.STAR] = 14;
      typeMap[_spaceTypes.CHANCE] = 5;
      typeMap[_spaceTypes.START] = 0; // N/A
      typeMap[_spaceTypes.SHROOM] = 0; // N/A
      typeMap[_spaceTypes.BOWSER] = 12;
      typeMap[_spaceTypes.ITEM] = 6;
      typeMap[_spaceTypes.BATTLE] = 9;
      typeMap[_spaceTypes.BANK] = 7;
      typeMap[_spaceTypes.ARROW] = 13;
      typeMap[_spaceTypes.BLACKSTAR] = 15;
      typeMap[_spaceTypes.GAMEGUY] = 0; // N/A
      board.spaces.forEach((space) => {
        let newType = typeMap[space.type];
        if (newType !== undefined)
          space.type = newType;
      });
    }

    onGetBoardCoordsFromGameCoords(x, y, z, width, height, boardIndex) {
      // The following is a bunch of crappy approximations.
      let newX, newY, newZ;
      switch (boardIndex) {
        case 0: // Western Land
        case 1: // TODO here and down, not right probably
        case 2: // 
        case 3: // 
        case 4: // 
        case 5: // 
        case 6: // 
          newX = (width / 2) + (x * (1 + (y * 0.01 / (height / 2))))
               - 150 * (x / (width / 2));
          newY = (height / 2) + ((y - 5) * 0.60);
          if (newY < (height / 2))
            newY += Math.abs(y) / 10;
          else
            newY -= Math.abs(y) / 20;
          newZ = 0;
          break;
        case 1: // 
        case 2: // 
        case 3: // 
        case 4: // 
        case 5: // 
        case 6: // 
        case 7: // 
        case 8: // 
        case 9: // 
        case 10: // 
          newX = (width / 2) + x;
          newY = (height / 2) + y;
          newZ = 0;
          break;
        default:
          throw "onGetBoardCoordsFromGameCoords called with bad boardIndex";
      }

      return [Math.round(newX), Math.round(newY), Math.round(newZ)];
    }

    onGetGameCoordsFromBoardCoords(x, y, z, width, height, boardIndex) {
      // The following is the inverse of a bunch of crappy approximations.
      let gameX, gameY, gameZ;
      switch (boardIndex) {
        case 0:
          gameY = -(5 / 6) * (height - 2 * (y + 3));
          if (y < (height / 2))
            gameY -= Math.abs(gameY) / 10;
          else
            gameY += Math.abs(gameY) / 20;
          gameX = (25 * height * width * (2 * x - width)) / (50 * height * (width - 300) + width * gameY);
          gameZ = 0;
          break;
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
          gameX = x - (width / 2);
          gameY = y - (height / 2);
          gameZ = 0;
          break;
        default:
          throw "onGetGameCoordsFromBoardCoords called with bad boardIndex";
      }

      return [gameX, gameY, gameZ];
    }

    _readAnimationBackgrounds(board, boardInfo) {
      if (isNaN(boardInfo.animBgSet) || !boardInfo.bgDir)
        return;

      // Perf: This is a bit redundant because we read the data URI previously.
      let mainBgImgData = PP64.adapters.hvqfs.readBackgroundImgData(boardInfo.bgDir);

      let animBgs = PP64.adapters.animationfs.readAnimationBackgrounds(boardInfo.animBgSet, mainBgImgData, board.bg.width, board.bg.height);
      if (animBgs && animBgs.length)
        board.animbg = animBgs;
    }

    _writeAnimationBackgrounds(setIndex, mainBgSrc, animSources, width, height) {
      return new Promise(function(resolve, reject) {
        if (isNaN(setIndex) || !animSources || !animSources.length) {
          resolve();
          return;
        }

        let failTimer = setTimeout(() => reject(`Failed to write animations`), 45000);

        let mainBgImgData;
        let animImgData = new Array(animSources.length);

        let mainBgPromise = new Promise(function(resolve, reject) {
          let canvasCtx = PP64.utils.canvas.createContext(width, height);
          let srcImage = new Image();
          srcImage.onload = function() {
            canvasCtx.drawImage(srcImage, 0, 0, width, height);
            mainBgImgData = canvasCtx.getImageData(0, 0, width, height);
            resolve();
          };
          srcImage.src = mainBgSrc;
        });

        let animPromises = [mainBgPromise];

        for (let i = 0; i < animSources.length; i++) {
          let animPromise = new Promise(function(resolve, reject) {
            let canvasCtx = PP64.utils.canvas.createContext(width, height);
            let srcImage = new Image();
            srcImage.onload = function() {
              canvasCtx.drawImage(srcImage, 0, 0, width, height);
              animImgData[this.index] = canvasCtx.getImageData(0, 0, width, height);
              resolve();
            }.bind({ index: i });
            srcImage.src = animSources[this.index];
          }.bind({ index: i }));
          animPromises.push(animPromise);
        }

        Promise.all(animPromises).then(value => {
          for (let i = 0; i < animImgData.length; i++) {
            PP64.adapters.animationfs.writeAnimationBackground(setIndex, i, mainBgImgData, animImgData[i], width, height);
          }
          $$log("Wrote animations");
          clearTimeout(failTimer);
          resolve();
        }, reason => {
          $$log(`Error writing animations: ${reason}`);
          reject();
        });
      });
    }

    onParseBoardSelectImg(board, boardInfo) {
      if (!boardInfo.img.boardSelectImg)
        return;

      board.otherbg.boardselect = this._readImgFromMainFS(9, boardInfo.img.boardSelectImg, 0);
    }

    onWriteBoardSelectImg(board, boardInfo) {
      return new Promise((resolve, reject) => {
        let boardSelectImg = boardInfo.img.boardSelectImg;
        if (!boardSelectImg) {
          resolve();
          return;
        }

        let srcImage = new Image();
        let failTimer = setTimeout(() => reject(`Failed to write board select for ${boardInfo.name}`), 45000);
        srcImage.onload = () => {
          let imgBuffer = PP64.utils.img.toArrayBuffer(srcImage, 64, 48);

          // First, read the old image pack.
          let oldPack = PP64.adapters.mainfs.get(9, boardSelectImg);

          // Then, pack the image and write it.
          let imgInfoArr = [
            {
              src: imgBuffer,
              width: 64,
              height: 48,
              bpp: 32,
            }
          ];
          let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
          PP64.adapters.mainfs.write(9, boardSelectImg, newPack);

          clearTimeout(failTimer);
          resolve();
        };
        srcImage.src = board.otherbg.boardselect;
      });
    }

    _parseBoardSelectIcon(board, boardInfo) {
      if (!boardInfo.img.boardSelectIconCoords)
        return;

      let bgInfo = this._readImgInfoFromMainFS(9, 15, 0);
      let [x, y] = boardInfo.img.boardSelectIconCoords;
      let icon = PP64.utils.img.cutFromWhole(bgInfo.src, bgInfo.width, bgInfo.height, 32, x, y, 32, 32);
      let dataUrl = PP64.utils.arrays.arrayBufferToDataURL(icon, 32, 32);
      board.otherbg.boardselecticon = dataUrl;
    }

    _writeBoardSelectIcon(board, boardInfo) {
      return new Promise((resolve, reject) => {
        if (!boardInfo.img.boardSelectIconCoords) {
          resolve();
          return;
        }
        let boardSelectIconSrc = board.otherbg.boardselecticon;
        if (!boardSelectIconSrc) {
          resolve();
          return;
        }

        let failTimer = setTimeout(() => reject(`Failed to write board select icon for ${boardInfo.name}`), 45000);

        let blankBackImage, newBoardSelectIconImage;

        let blankBackPromise = new Promise(function(resolve, reject) {
          blankBackImage = new Image();
          blankBackImage.onload = function() {
            resolve();
          };
          blankBackImage.src = "img/details/mp2boardselectblank1.png";
        });

        let newIconPromise = new Promise(function(resolve, reject) {
          newBoardSelectIconImage = new Image();
          newBoardSelectIconImage.onload = function() {
            resolve();
          };
          newBoardSelectIconImage.src = boardSelectIconSrc;
        });

        let iconPromises = [blankBackPromise, newIconPromise];
        Promise.all(iconPromises).then(value => {
          let bgInfo = this._readImgInfoFromMainFS(9, 15, 0); // Read the existing icon select thing

          // Draw the original onto a canvas
          let canvasCtx = PP64.utils.canvas.createContext(bgInfo.width, bgInfo.height);
          let origImageData = PP64.utils.arrays.arrayBufferToImageData(bgInfo.src, bgInfo.width, bgInfo.height);
          canvasCtx.putImageData(origImageData, 0, 0);

          // Then draw the "clean slate" for the icon, and the given icon.
          let [x, y] = boardInfo.img.boardSelectIconCoords;
          canvasCtx.drawImage(blankBackImage, x, y, 32, 32);
          canvasCtx.drawImage(newBoardSelectIconImage, x, y, 32, 32);

          // Place edited icon select thing back into ROM
          let finalIconSelectThingBuffer = canvasCtx.getImageData(0, 0, bgInfo.width, bgInfo.height).data.buffer;

          // Read the old image pack.
          let oldPack = PP64.adapters.mainfs.get(9, 15);

          // Then, pack the image and write it.
          let imgInfoArr = [
            {
              src: finalIconSelectThingBuffer,
              width: bgInfo.width,
              height: bgInfo.height,
              bpp: 32,
            }
          ];
          let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
          PP64.adapters.mainfs.write(9, 15, newPack);

          // Write the hover mask for the new image
          if (boardInfo.img.boardSelectIconMask) {
            let mask = this._createBoardSelectIconHoverMask(newBoardSelectIconImage);

            let oldPack = PP64.adapters.mainfs.get(9, boardInfo.img.boardSelectIconMask);

            // Then, pack the image and write it.
            let imgInfoArr = [
              {
                src: mask,
                width: 32,
                height: 32,
                bpp: 32,
              }
            ];
            let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
            PP64.adapters.mainfs.write(9, boardInfo.img.boardSelectIconMask, newPack);
          }

          $$log("Wrote board select icon");
          clearTimeout(failTimer);
          resolve();
        }, reason => {
          $$log(`Error writing board select icon: ${reason}`);
          reject();
        });
      });
    }

    // This creates the asset that is used to create the rainbow hover effect
    // over the board select icon. The effect is a bit crude now; the original
    // mask can have some semi-transparent edges, but this just either adds
    // a #00000000 or #BBBBBBFF pixel based on the given icon.
    _createBoardSelectIconHoverMask(newIconImage) {
      let newIconBuffer = PP64.utils.img.toArrayBuffer(newIconImage, 32, 32);
      let maskBuffer = new ArrayBuffer(newIconBuffer.byteLength);

      let newIconView = new DataView(newIconBuffer);
      let maskView = new DataView(maskBuffer);

      let hasTransparency = false;

      for (let i = 0; i < maskBuffer.byteLength; i += 4) {
        if (newIconView.getUint32(i) === 0) {
          maskView.setUint32(i, 0);
          hasTransparency = true;
        }
        else
          maskView.setUint32(i, 0xBBBBBBFF);
      }

      // If someone gives a totally non-transparent image... well the mask won't
      // work very well. We will just clear out the mask, no hover effect then.
      if (!hasTransparency) {
        return new ArrayBuffer(newIconBuffer.byteLength);
      }

      return maskBuffer;
    }

    onParseBoardLogoImg(board, boardInfo) {
      if (!boardInfo.img.introLogoImg)
        return;

      board.otherbg.boardlogo = this._readImgFromMainFS(10, boardInfo.img.introLogoImg, 0);
    }

    onWriteBoardLogoImg(board, boardInfo) {
      return new Promise((resolve, reject) => {
        let introLogoImg = boardInfo.img.introLogoImg;
        if (!introLogoImg) {
          resolve();
          return;
        }

        let srcImage = new Image();
        let failTimer = setTimeout(() => reject(`Failed to write logos for ${boardInfo.name}`), 45000);
        srcImage.onload = () => {
          // Write the intro logo images.
          let imgBuffer = PP64.utils.img.toArrayBuffer(srcImage, 260, 120);

          // First, read the old image pack.
          let oldPack = PP64.adapters.mainfs.get(10, introLogoImg);

          // Then, pack the image and write it.
          let imgInfoArr = [
            {
              src: imgBuffer,
              width: 260,
              height: 120,
              bpp: 32,
            }
          ];
          let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
          PP64.adapters.mainfs.write(10, introLogoImg, newPack);

          clearTimeout(failTimer);
          resolve();
        };
        srcImage.src = board.otherbg.boardlogo;

        // Just blank out the pause logo, it is not worth replacing.
        let pauseLogoImg = boardInfo.img.pauseLogoImg;
        if (pauseLogoImg) {
          let oldPack = PP64.adapters.mainfs.get(10, pauseLogoImg);
          let imgInfoArr = [{
            src: new ArrayBuffer(130 * 60 * 4),
            width: 130,
            height: 60,
            bpp: 32,
          }];
          let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
          PP64.adapters.mainfs.write(10, pauseLogoImg, newPack);
        }
      });
    }

    // Same as _writeBackground essentially, but for some reason MP2 overview background
    // doesn't line up when just shrinking the background naively.
    // If we shift it up by 1 tile's worth of height, it lines up better.
    _writeOverviewBackground(bgIndex, src) {
      return new Promise((resolve, reject) => {
        let canvasCtx = PP64.utils.canvas.createContext(320, 240);
        let srcImage = new Image();
        let failTimer = setTimeout(() => reject(`Failed to write bg ${bgIndex}`), 45000);
        srcImage.onload = () => {
          canvasCtx.drawImage(srcImage, 0, -10, 320, 240);

          let imgData = canvasCtx.getImageData(0, 0, 320, 240);
          PP64.adapters.hvqfs.writeBackground(bgIndex, imgData, 320, 240);
          clearTimeout(failTimer);
          resolve();
        };
        srcImage.src = src;
      });
    }

    // Writes to 0x800CD524, break 0x80079390
    getAudioMap() {
      return [
        "", // 0x00 Two Beeps
        "Story One",
        "Go Lucky",
        "Welcome to Mario Land",
        "Laboratory",
        "Rules Land",
        "Credits", // ?
        "In the Pipe",
        "Western Land",
        "Pirate Land",
        "Space Land",
        "Horror Land",
        "Mystery Land",
        "Bowser Land", // ?
        "Adventure Begins",
        "The Adventure Ends",
        "Ending", // 0x10
        "Star Spot",
        "Bowser's Theme",
        "A Ways to Go",
        "How Many",
        "Take the Coin",
        "Let the Game Begin",
        "", // Two Beeps
        "", // Two Beeps
        "", // Two Beeps
        "", // Two Beeps
        "Going for the Coins",
        "Not Gonna Lose",
        "Keepin' on the Path",
        "Couldn't be Better",
        "Know What I Mean?",
        "That's All of It", // 0x20
        "Let's Have Some Fun",
        "The Blue Skies Yonder",
        "Chance Time",
        "Going Somewhere",
        "Duel!",
        "No Fright, No Fear",
        "Don't Look Back",
        "Got an Item",
        "This Way That",
        "Walking Underwater",
        "Spinning Polka",
        "Spinning Polka 2", // ?
        "Spinning Polka 3", // ?
        "", //"Jamming Groove", // ?
        "", //"Electronic Groove", // ? These two from visiting characters?
        "", // 0x30 Two Beeps
        "", //"Plays in 'facing' direction mini-game",
        "Mini-Game Land",
        "", //"Dripping Lazy beat",
        "", //"Do da do dee doot played at times",
        "Battle Start",
        "", //"Energetic battle end?",
        "", // Two Beeps
        "", //"Music from Tree land?",
        "", //"Anticipatory dingles",
        "The Way to Play",
        "The Star Appears",
        "Bowser Appears",
        "I Can Do It!",
        //"Bowser Beat",
        //"Finale song",
        // "Story Two", // 0x40
        // "Story Three",
        // "Drumroll", // From results
        //"Drumroll Short", // From results
        // "Success Mini-Game Result",
        // "Failure Mini-Game Result",
        // "", // Two Beeps
        // "Cringy squeaky song",
        //"Anticipatory flutters/dingdong",
        //"Bells up up upup upupd dodowndowndowndown", These are probably the mini-game mine themes
        //"Same as above but muted",
        //"Same above but jazz and kongos",
        //"Same beat but jazz flute solo",
        //"More of the beat in a remix",
        //"Big chords beat continues",
        //"More of the same thing"
        //"", 0x50 Two Beeps
        // "Success Mini-Game Result",
        // "Success Mini-Game Result",
        // "Kind of Success Mini-Game Result",
        // "Mini-Game turned sour",
        // "Great fanfare",
        // "Failure fanfare",
        // "Disappointing result",
        // "Fanfare",
        // "Players run across screen intro fanfare",
        // "Silent",
        // "Intro To Mario Land - Bowser Land Appears",
        // "Fanfare",
        // "Anti-fanfare",
        // "Genie Theme",
        // "Silent",
        // "Fanfare", // 0x60
      ];
    }

    // Mostly a MP1 copy for now.
    getCharacterMap() {
      return {
        0x00: "", // NULL terminator
        0x01: "{BLACK}",
        0x02: "{DEFAULT}",
        0x03: "{RED}",
        0x04: "{PURPLE}",
        0x05: "{GREEN}",
        0x06: "{BLUE}",
        0x07: "{YELLOW}",
        0x08: "{WHITE}",
        0x09: "{SEIZURE}",
        0x0A: "\n",
        0x0B: "\u3014", // FEED Carriage return / start of bubble?
        0x0C: "○", // 2ND BYTE OF PLAYER CHOICE
        0x0D: "\t", // UNCONFIRMED / WRONG
        0x0E: "\t", // 1ST BYTE OF PLAYER CHOICE
        // 0x0F - nothing
        0x10: " ",
        0x11: "{0}", // These are format params that get replaced with various things
        0x12: "{1}",
        0x13: "{2}",
        0x14: "{3}",
        0x15: "{4}",
        0x16: "{5}",
        // Theoretically there may be more up through 0x20?
        // 0x18 - nothing
        // 0x20 - nothing
        0x21: "\u3000", // ! A button
        0x22: "\u3001", // " B button
        0x23: "\u3002", //  C-up button
        0x24: "\u3003", //  C-right button
        0x25: "\u3004", //  C-left button
        0x26: "\u3005", // & C-down button
        0x27: "\u3006", // ' Z button
        0x28: "\u3007", // ( Analog stick
        0x29: "\u3008", // ) (coin)
        0x2A: "\u3009", // * Star
        0x2B: "\u3010", // , S button
        0x2C: "\u3011", // , R button
        // 0x2D - nothing
        // 0x2E - nothing
        // 0x2F - nothing
        // 0x30 - 0x39: 0-9 ascii
        0x3A: "\u3012", // Hollow coin
        0x3B: "\u3013", // Hollow star
        0x3C: "+", // <
        0x3D: "-", // =
        0x3E: "x", // > Little x
        0x3F: "->", // Little right ARROW
        // 0x40 - nothing
        // 0x41 - 0x5A: A-Z ascii
        0x5B: "\"", // [ End quotes
        0x5C: "'", // \ Single quote
        0x5D: "(", // ] Open parenthesis
        0x5E: ")",
        0x5F: "/", // _
        // 0x60 - nothing
        // 0x61 - 0x7A: a-z ascii
        0x7B: ":", // :
        0x80: "\"", // Double quote no angle
        0x81: "°", // . Degree
        0x82: ",", // ,
        0x83: "°", // Low circle FIXME
        0x85: ".", // … Period
        0xC0: "“", // A`
        0xC1: "”", // A'
        0xC2: "!", // A^
        0xC3: "?", // A~
        0xFF: "\u3015", // PAUSE
      };
    }
  }
  return new MP2Adapter();
})();
