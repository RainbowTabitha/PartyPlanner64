PP64.ns("adapters");

PP64.adapters.MP3 = (function() {
  const MP3Adapter = class extends PP64.adapters.AdapterBase {
    constructor() {
      super();
      this.gameVersion = 3;

      this.nintendoLogoFSEntry = [17, 1];
      this.hudsonLogoFSEntry = [17, 2];
      this.boardDefDirectory = 19;

      this.MAINFS_READ_ADDR = 0x00009C10;
      this.HEAP_FREE_ADDR = 0x00009E6C;
      this.TABLE_HYDRATE_ADDR = 0x000EBA60;
    }

    onLoad(board, boardInfo) {
      this._extractBanks(board, boardInfo);
      this._extractItemShops(board, boardInfo);
    }

    onAfterOverwrite(romView, board, boardInfo) {
      this._writeBanks(board, boardInfo);
      this._writeItemShops(board, boardInfo);

      // Patch game to use all 8MB.
      romView.setUint16(0x360EE, 0x8040); // Main heap now starts at 0x80400000
      romView.setUint16(0x360F6, (0x00400000 - this.EVENT_MEM_SIZE) >>> 16); // ... and can fill up through reserved event space
      romView.setUint16(0x36102, 0x001A); // Temp heap fills as much as 0x1A8000 (8000 is ORed in)
      romView.setUint16(0x495D6, 0x001A);

      // The game will soft hang when the number of plain spaces (red/blue) is
      // less than a certain lowish number.
      // I don't know exactly what it is trying to do, but if we do this patch,
      // it seems to not be adversely affected and also resolves the hang.
      // TODO: Waste time figuring out the exact threshold or the actual cause of the bug.
      // Hang around 0x800FC664
      let simpleSpaceCount = 0;
      for (let i = 0; i < board.spaces.length; i++) {
        let space = board.spaces[i];
        if (space.type === $spaceType.BLUE || space.type === $spaceType.RED)
          simpleSpaceCount++;
      }
      if (simpleSpaceCount < 20) {
        // Commented out, didn't work...
        //romView.setUint32(0xFF3DC, 0); // This is a J in the 0x800EBxxx range... I closed the window and forgot exactly.
        //$$log("Patching 0xFF3DC for low space count.");
      }
    }

    onOverwritePromises(board, boardInfo) {
      let bgIndex = boardInfo.bgDir;
      let bgPromises = [
        this._writeBackground(bgIndex, board.bg.src, board.bg.width, board.bg.height),
        this._writeBackground(bgIndex + 1, board.otherbg.largescene, 320, 240), // Game start, end
        this._writeBackground(bgIndex + 2, board.bg.src, 320, 240), // Overview map
        this.onWriteBoardSelectImg(board, boardInfo),
        this.onWriteBoardLogoImg(board, boardInfo), // Various board logos
        this.onWriteBoardLogoTextImg(board, boardInfo),
        this._brandBootSplashscreen(),
      ];

      return Promise.all(bgPromises)
    }

    onAfterSave(romView) {
      // TRIGGERED! This is some sort of debug hang loop that triggers as a
      // result of overwriting the ROM. It has something to do with loading the
      // strings structures. If I knew what I was doing wrong, I would fixed it,
      // but for now it actually doesn't seem to be a problem to just NOP it.
      romView.setUint32(0x0000CEC0, 0);

      // The release ROM has debugger checks in it, which can cause some
      // emulators (Nemu64) to be upset. This stops the debugger checks.
      romView.setUint32(0x0007FC58, 0); // Don't check if KMC worked...
      romView.setUint32(0x0007FC60, 0); // Don't do KMC success action...
      // The "return;" is just hit after this and the rest of the checks are skipped.
    }

    hydrateSpace(space) {
      if (space.type === $spaceType.BANK) {
        PP64.boards.addEventToSpace(space, PP64.adapters.events.create("BANK"));
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
        15: _spaceTypes.GAMEGUY,
        16: _spaceTypes.OTHER, // Toad
        17: _spaceTypes.OTHER, // Baby Bowser the COHORT
      };
      board.spaces.forEach((space) => {
        let newType = typeMap[space.type];
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
      typeMap[_spaceTypes.GAMEGUY] = 15; // ?
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
        case 0: // Chilly Waters
        case 1: // Deep Bloober Sea (TODO FIXME for 1+)
        case 2: // 
        case 3: // 
        case 4: // 
        case 5: // 
          newX = (width / 2) + (x * (1 + (y * 0.05 / (height / 2))))
               - 130 * (x / (width / 2));
          newY = (height / 2) + ((y + 100) * 0.4);
          if (newY < (height / 2))
            newY -= Math.abs(y) / 11.5;
          else
            newY += Math.abs(y) / 4.8;
          newZ = 0;
          break;
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
          gameY = (-5 / 4) * (height - (2 * y) + 80);
          if (y < (height / 2) + 35) {
            gameY += Math.abs(gameY) / 7.7;
            gameY += 105; //WTF?
          }
          else {
            gameY -= Math.abs(gameY) / 2.91;
            gameY += 69;
          }
          gameX = (5 * height * width * (2 * x - width)) / (10 * height * (width - 260) + (width * gameY));
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

    // Creates the chain-based event objects that we abstract out in the UI.
    // Override from base to also add reverse shroom events and special chain split.
    onCreateChainEvents(board, chains) {
      // There is either a merge or a split at the end of each chain.
      for (let i = 0; i < chains.length; i++) {
        let chain = chains[i];
        let firstSpace = chain[0];
        let secondSpace = chain[1];
        let lastSpace = chain[chain.length - 1];
        let prevSpace = chain[chain.length - 2]; // For MP3
        let endLinks = board.links[lastSpace];
        if (!Array.isArray(endLinks))
          endLinks = [endLinks];
        let event;
        if (endLinks.length > 1) {
          // A split, figure out the end points.

          if (endLinks.length > 2)
            throw "MP3 cannot support more than 2 split directions";

          let chainIndices = [];
          endLinks.forEach(link => {
            chainIndices.push(_getChainWithSpace(link));
          });

          // Create the args, which are more sophisticated / declarative in MP3 (yay)
          // The args consist of the space indices and chain indices of the two directions,
          // as well as a couple variations of each when they are used with reverse shroom.
          let inlineArgs = [];
          inlineArgs.push(endLinks[0]); // First two space indices
          inlineArgs.push(endLinks[1]);
          inlineArgs.push(0xFFFF);

          inlineArgs.push(prevSpace); // As if returning from first link direction
          inlineArgs.push(endLinks[1]);
          inlineArgs.push(0xFFFF);

          inlineArgs.push(prevSpace); // As if returning from 2nd link direction
          inlineArgs.push(endLinks[0]);
          inlineArgs.push(0xFFFF);
          inlineArgs.push(0x0000);

          inlineArgs.push(chainIndices[0]); // Now the two chain indices and the "indices into the chains"
          inlineArgs.push(0x0000); // We know these two are always 0 because of how we generate chains.
          inlineArgs.push(0x0000); // mystery
          inlineArgs.push(chainIndices[1]);
          inlineArgs.push(0x0000);
          inlineArgs.push(0x0000); // mystery

          inlineArgs.push(i);
          inlineArgs.push(chain.length - 2); // Return to _near_ end of entering chain
          inlineArgs.push(0x0001); // mystery
          inlineArgs.push(chainIndices[1]);  // ...yes they flip, for confusion
          inlineArgs.push(0x0000);
          inlineArgs.push(0x0000);

          inlineArgs.push(i);
          inlineArgs.push(chain.length - 2); // Return to _near_ end of entering chain
          inlineArgs.push(0x0001);
          inlineArgs.push(chainIndices[0]);
          inlineArgs.push(0x0000);
          inlineArgs.push(0x0000);

          event = PP64.adapters.events.create("CHAINSPLIT", {
            args: { inline: inlineArgs },
            chains: chainIndices,
          });
          PP64.boards.addEventByIndex(board, lastSpace, event, true);

          // Now add the two reverse events that would take the player back to
          // the split event space.

          // event = PP64.adapters.events.create("CHAINMERGE", {
          //   chain: i,
          //   spaceIndex: chain.length - 1,
          //   prevSpace: chains[chainIndices[0]][1], // The 2nd space of the chain, which would have been previous when going reverse.
          // });
          // PP64.boards.addEventByIndex(board, endLinks[0], event, true);

          // event = PP64.adapters.events.create("CHAINMERGE", {
          //   chain: i,
          //   spaceIndex: chain.length - 1,
          //   prevSpace: chains[chainIndices[1]][1], // The 2nd space of the chain, which would have been previous when going reverse.
          // });
          // PP64.boards.addEventByIndex(board, endLinks[1], event, true);
        }
        else {
          event = PP64.adapters.events.create("CHAINMERGE", {
            chain: _getChainWithSpace(endLinks[0]),
            prevSpace, // For MP3
          });
          PP64.boards.addEventByIndex(board, lastSpace, event, true);
        }

        // See if we need a reverse split event, reverse chain merge, or safety chain merge.
        let pointingSpaces = _getSpacesPointingToSpace(firstSpace);
        if (pointingSpaces.length) {
          let chainIndices = [];
          pointingSpaces.forEach(link => {
            chainIndices.push(_getChainWithSpace(link));
          });
          let pointingChains = [];
          chainIndices.forEach(index => {
            pointingChains.push(chains[index]);
          });

          if (pointingSpaces.length >= 2) { // Build a reverse split.
            // FIXME: This obviously only deals with === 2, but rather than
            // restrict boards, we can just arbitrarily not allow going backwards
            // in some particular direction(s) for now.

            // The reverse args are basically the same, except the 1 bit is placed differently.
            let inlineArgs = [];
            inlineArgs.push(secondSpace);
            inlineArgs.push(pointingSpaces[0]);
            inlineArgs.push(0xFFFF);

            inlineArgs.push(pointingSpaces[1]); // Probably the only indices that matter
            inlineArgs.push(pointingSpaces[0]);
            inlineArgs.push(0xFFFF);

            inlineArgs.push(pointingSpaces[1]);
            inlineArgs.push(secondSpace);
            inlineArgs.push(0xFFFF);
            inlineArgs.push(0x0000);

            // Now the chain indices and the "indices into the chains"
            inlineArgs.push(i);
            inlineArgs.push(0x0001); // Second space index
            inlineArgs.push(0x0000);
            inlineArgs.push(chainIndices[0]);
            inlineArgs.push(pointingChains[0].length - 1); // Return to end of entering chain
            inlineArgs.push(0x0001);

            inlineArgs.push(chainIndices[1]);
            inlineArgs.push(pointingChains[1].length - 1);
            inlineArgs.push(0x0001);
            inlineArgs.push(chainIndices[0]);
            inlineArgs.push(pointingChains[0].length - 1);
            inlineArgs.push(0x0001);

            inlineArgs.push(chainIndices[1]);
            inlineArgs.push(pointingChains[1].length - 1);
            inlineArgs.push(0x0001);
            inlineArgs.push(i);
            inlineArgs.push(0x0001); // Second space index
            inlineArgs.push(0x0000);

            event = PP64.adapters.events.create("REVERSECHAINSPLIT", {
              args: { inline: inlineArgs },
              chains: chainIndices,
            });
            PP64.boards.addEventByIndex(board, firstSpace, event, true);
          }
          else if (pointingSpaces.length === 1) { // Build a reverse merge
            event = PP64.adapters.events.create("CHAINMERGE", {
              chain: chainIndices[0], // Go to pointing chain
              spaceIndex: pointingChains[0].length - 1, // Go to last space of pointing chain
              prevSpace: secondSpace, // The 2nd space of this chain, which would have been previous when going reverse.
            });
            PP64.boards.addEventByIndex(board, firstSpace, event, true);
          }
        }
        else {
          // If nothing points to this chain, the player could still reverse their
          // way towards the beginning of the chain (start space for example).
          // At the start of these chains, we put a type 8 event to spin them around.
          // It is redundant when going forward on the chain but doesn't hurt.
          let firstLinks = board.links[firstSpace];
          if (!Array.isArray(firstLinks))
            firstLinks = [firstLinks];

          if (firstLinks.length > 1) {
            $$log("FIXME: branching isolated chain?");
          }
          else {
            // This doesn't crash, but it creates a back forth loop at a dead end.
            // This probably will yield issues if the loop is over invisible spaces.
            event = PP64.adapters.events.create("CHAINMERGE", {
              chain: i,
              spaceIndex: 1, // Because of chain padding, this should be safe
              prevSpace: 0xFFFF,
            });
            event.activationType = $activationType.BEGINORWALKOVER;
            PP64.boards.addEventByIndex(board, firstSpace, event, true);
          }
        }
      }

      function _getChainWithSpace(space) {
        for (let c = 0; c < chains.length; c++) {
          if (chains[c].indexOf(space) >= 0) // Should really be 0 always - game does support supplied index other than 0 though.
            return c;
        }
      }

      function _getSpacesPointingToSpace(space) {
        let pointingSpaces = [];
        for (let s = 0; s < board.spaces.length; s++) {
          let spaceLinks = board.links[s];
          if (!Array.isArray(spaceLinks))
            spaceLinks = [spaceLinks];
          if (spaceLinks.indexOf(space) >= 0)
            pointingSpaces.push(s);
        }
        return pointingSpaces;
      }
    }

    onParseStrings(board, boardInfo) {
      let strs = boardInfo.str || {};
      if (strs.boardSelect) {
        let idx = strs.boardSelect[0];
        let str = PP64.adapters.strings3.read("en", idx[0], idx[1]);
        let lines = str.split("\n");

        // Read the board name and description.
        let nameStart = lines[0].indexOf("}") + 2;
        let nameEnd = lines[0].indexOf("{", nameStart);
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
      if (strs.boardSelect && strs.boardSelect.length) {
        let bytes = [];
        bytes.push(0x0B); // Clear?
        bytes.push(0x05); // Start GREEN
        bytes.push(0x0F); // ?
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(board.name || ""));
        bytes.push(0x16);
        bytes.push(0x19);
        bytes.push(0x0F);
        bytes = bytes.concat([0x20, 0x20, 0x20, 0x20]); // Spaces
        bytes.push(0x16);
        bytes.push(0x03);
        bytes.push(0x0F);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("Difficulty: "));
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
        bytes.push(0x16);
        bytes.push(0x19);
        bytes.push(0x0A); // \n
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(board.description || "")); // Assumes \n's are correct within.
        bytes.push(0x00); // Null byte

        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);

        let idx = strs.boardSelect[0];
        PP64.adapters.strings3.write("en", idx[0], idx[1], strBuffer);

        // The second copy is mostly the same, but add a couple more bytes at the end.
        bytes.pop(); // Null byte
        bytes.push(0x19);
        bytes.push(0xFF);
        bytes.push(0x00); // Null byte

        strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);

        idx = strs.boardSelect[1];
        PP64.adapters.strings3.write("en", idx[0], idx[1], strBuffer);
      }

      if (strs.boardGreeting) {
        let bytes = [];
        bytes.push(0x0B);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("You're all here!"));
        bytes.push(0x0A); // \n
        bytes = bytes.concat(this._createBoardGreetingBase(board.name));
        bytes.push(0x0B); // ?
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("Now, before we begin, we need\nto determine the turn order."));
        bytes.push(0x19); // ?
        bytes.push(0xFF); // ?
        bytes.push(0x00); // Null byte

        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);
        PP64.adapters.strings3.write("en", strs.boardGreeting[0], strs.boardGreeting[1], strBuffer);
      }

      if (strs.boardGreetingDuel) {
        let bytes = [];
        bytes.push(0x0B);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("I've been waiting for you, "));
        bytes.push(0x11); // ?
        bytes.push(0xC2); // ?
        bytes.push(0x0A); // \n
        bytes = bytes.concat(this._createBoardGreetingBase(board.name));
        bytes.push(0x0B); // ?
        bytes = bytes.concat(PP64.adapters.strings._strToBytes("And just as promised, if you win here..."));
        bytes.push(0x19); // ?
        bytes.push(0xFF); // ?
        bytes.push(0x00); // Null byte

        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);
        PP64.adapters.strings3.write("en", strs.boardGreetingDuel[0], strs.boardGreetingDuel[1], strBuffer);
      }

      if (strs.boardNames && strs.boardNames.length) {
        let bytes = [];
        bytes.push(0x0B);
        bytes = bytes.concat(PP64.adapters.strings._strToBytes(board.name));
        bytes.push(0x00); // Null byte
        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(bytes);

        for (let i = 0; i < strs.boardNames.length; i++) {
          let idx = strs.boardNames[i];
          PP64.adapters.strings3.write("en", idx[0], idx[1], strBuffer);
        }
      }
    }

    _createBoardGreetingBase(boardName) {
      let bytes = PP64.adapters.strings._strToBytes("Welcome to the legendary ");
      bytes.push(0x05); // Start GREEN
      bytes.push(0x0F); // ?
      bytes = bytes.concat(PP64.adapters.strings._strToBytes(boardName));
      bytes.push(0x16); // ?
      bytes.push(0x19); // ?
      bytes.push(0xC2); // ?
      bytes.push(0x19); // ?
      bytes.push(0xFF); // ?
      bytes.push(0x0B); // ?
      bytes = bytes.concat(PP64.adapters.strings._strToBytes("Here, you'll battle to become\nthe Superstar."));
      bytes.push(0x19); // ?
      bytes.push(0xFF); // ?
      return bytes;
    }

    onParseBoardSelectImg(board, boardInfo) {
      if (!boardInfo.img.boardSelectImg)
        return;

      board.otherbg.boardselect = this._readImgFromMainFS(20, boardInfo.img.boardSelectImg, 0);
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
          let imgBuffer = PP64.utils.img.toArrayBuffer(srcImage, 64, 64);

          // First, read the old image pack.
          let oldPack = PP64.adapters.mainfs.get(20, boardSelectImg);

          // Then, pack the image and write it.
          let imgInfoArr = [
            {
              src: imgBuffer,
              width: 64,
              height: 64,
              bpp: 32,
            }
          ];
          let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
          // saveAs(new Blob([newPack]), "imgpack");
          PP64.adapters.mainfs.write(20, boardSelectImg, newPack);

          clearTimeout(failTimer);
          resolve();
        };
        srcImage.src = board.otherbg.boardselect;
      });
    }

    onParseBoardLogoImg(board, boardInfo) {
      if (!boardInfo.img.splashLogoImg)
        return;

      board.otherbg.boardlogo = this._readImgFromMainFS(19, boardInfo.img.splashLogoImg, 0);
      board.otherbg.boardlogotext = this._readImgFromMainFS(19, boardInfo.img.splashLogoTextImg, 0);
    }

    onWriteBoardLogoImg(board, boardInfo) {
      return new Promise((resolve, reject) => {
        let splashLogoImg = boardInfo.img.splashLogoImg;
        if (!splashLogoImg) {
          resolve();
          return;
        }

        let srcImage = new Image();
        let failTimer = setTimeout(() => reject(`Failed to write logos for ${boardInfo.name}`), 45000);
        srcImage.onload = () => {
          // Write the intro logo images.
          let imgBuffer = PP64.utils.img.toArrayBuffer(srcImage, 226, 120);

          // First, read the old image pack.
          let oldPack = PP64.adapters.mainfs.get(19, splashLogoImg);

          // Then, pack the image and write it.
          let imgInfoArr = [
            {
              src: imgBuffer,
              width: 226,
              height: 120,
              bpp: 32,
            }
          ];
          let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
          // saveAs(new Blob([newPack]), "imgpack");
          PP64.adapters.mainfs.write(19, splashLogoImg, newPack);

          clearTimeout(failTimer);
          resolve();
        };
        srcImage.src = board.otherbg.boardlogo;

        // Just blank out the pause logo, it is not worth replacing.
        let pauseLogoImg = boardInfo.img.pauseLogoImg;
        if (pauseLogoImg) {
          let oldPack = PP64.adapters.mainfs.get(19, pauseLogoImg);
          let imgInfoArr = [{
            src: new ArrayBuffer(150 * 50 * 4),
            width: 150,
            height: 50,
            bpp: 32,
          }];
          let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
          PP64.adapters.mainfs.write(19, pauseLogoImg, newPack);
        }
      });
    }

    onWriteBoardLogoTextImg(board, boardInfo) {
      return new Promise((resolve, reject) => {
        let splashLogoTextImg = boardInfo.img.splashLogoTextImg;
        if (!splashLogoTextImg) {
          resolve();
          return;
        }

        let srcImage = new Image();
        let failTimer = setTimeout(() => reject(`Failed to write logo text for ${boardInfo.name}`), 45000);
        srcImage.onload = () => {
          // Write the intro logo text image.
          let imgBuffer = PP64.utils.img.toArrayBuffer(srcImage, 226, 36);

          // First, read the old image pack.
          let oldPack = PP64.adapters.mainfs.get(19, splashLogoTextImg);

          // Then, pack the image and write it.
          let imgInfoArr = [
            {
              src: imgBuffer,
              width: 226,
              height: 36,
              bpp: 32,
            }
          ];
          let newPack = PP64.utils.img.ImgPack.toPack(imgInfoArr, 16, 0, oldPack);
          // saveAs(new Blob([newPack]), "imgpack");
          PP64.adapters.mainfs.write(19, splashLogoTextImg, newPack);

          clearTimeout(failTimer);
          resolve();
        };
        srcImage.src = board.otherbg.boardlogotext;
      });
    }

    onWriteAudio(board, boardInfo, boardIndex) {
      super.onWriteAudio(board, boardInfo, boardIndex);
      if (!boardInfo.audioIndexOffset)
        return;

      let boardView = PP64.romhandler.getDataView();
      let index = board.audioIndex;
      // MP3 writes the index in a couple other places too.
      boardView.setUint16(boardInfo.audioIndexOffset + 4, index);
      boardView.setUint16(boardInfo.audioIndexOffset + 0x14, index);
    }

    // Writes to 0x800A1904, break 0x8004a520 (JAL 0C012948)
    getAudioMap() {
      return [
        "Opening", // 0x00
        "Opening Demo",
        "Title Screen",
        "Select File",
        "Castle Grounds",
        "", // Two Beeps
        "Staff Roll",
        "Inside the Castle",
        "Free-Play Room",
        "Star Lift",
        "Preparations",
        "Rules Map",
        "", // Two Beeps
        "The Adventure Begins",
        "", // Two Beeps
        "The Adventure Ends",
        "Begin Mini-Game", // 0x10
        "", // Two Beeps
        "Here's the Star",
        "Still Going",
        "Mini-Game End 1",
        "Mini-Game End 2",
        "Mini-Game End 3",
        "Commence Attack!",
        "Chilly Waters",
        "Deep Bloober Sea",
        "Spiny Desert",
        "Woody Woods",
        "Creepy Cavern",
        "Waluigi",
        "Good Luck!",
        "The Winner is... Me!",
        "Swingsy laid back", // 0x20
        "Foolish Bowser",
        "", // Two Beeps
        "", // Two Beeps
        "Bowser Event",
        "", // Two Beeps
        "Victory!",
        "", // Two Beeps
        "Bowser Song",
        "Intense fight song",
        "Peaceful song, bells",
        "", // Two Beeps
        "Defeat...",
        "Aim",
        "Don't Hurry",
        "Panic!",
        "Fighting Spirit", // 0x30
        "Got It?",
        "Let's Get a Move On",
        "Looking Ahead",
        "Big Trouble!",
        "What To Do!?!",
        "Mustn't Panic",
        "Nice and Easy",
        "On Your Toes",
        "Prologue 1",
        "Prologue 2",
        "Prologue 3",
        "Genie's Theme",
        "Jeanie's Theme",
        "Start Battle",
        "", //"Short trumpet/drums fanfare",
        "", //"Short trumpet/drums fanfare 2", // 0x40
        "Electronic upbeat",
        "Chance Time",
        "Game Guy Mini-Game",
        "Item Mini-Game",
        "Mushroom Power-Up!",
        "Game Guy Winner!",
        "Game Guy Loser!",
        "Game Guy Dance",
        "Drumroll",
        "Inside the Castle",
        "", // Two Beeps
        "Battle Theme",
        "Electronic beat",
        "Ocean + Birds",
        "", //"Rapidly increase boopbop",
        "", // Two Beeps // 0x50
        "", // "Chilly Waters splashscreen fanfare" // 0x6E
        "", // "Quick fanfare" // 0x70
        "", // "Sad fanfare" // 0x71
        "", // "Medium fanfare" // 0x72
        "", // "Fanfare" // 0x73
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
        // 0x10: " ", works but not used?
        0x11: "{0}", // These are format params that get replaced with various things
        0x12: "{1}",
        0x13: "{2}",
        0x14: "{3}",
        0x15: "{4}",
        0x16: "{5}",
        // Theoretically there may be more up through 0x20?
        // 0x18 - nothing
        0x20: " ",
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
        0x7E: "&", // ~
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
  return new MP3Adapter();
})();
