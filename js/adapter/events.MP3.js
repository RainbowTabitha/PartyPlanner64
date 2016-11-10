PP64.ns("adapters.events");

PP64.adapters.events.MP3 = (function() {
  const hashEqual = PP64.utils.arrays.hashEqual;
  const EventCache = PP64.adapters.events.EventCache;

  // ChainMerge in 3 actually uses A0. It is always the space index of the
  // _previous_ space the player was before reaching the event space.
  // Except something like a dead end space, like the start space, which passes -1 for A0
  const ChainMerge = PP64.adapters.events.getEvent("CHAINMERGE");
  ChainMerge._parse3 = function(dataView, info) {
    const hashes = {
      START: "16092DD153432852C141C78807ECCBF0", // +0x08
      //MID: "123FF0D66026C628870C3DAEE5C63134", // [0x10]+0x04 // Use mergeJALs instead
      END: "0855E7309F121915D7A762AB85A7FDB6", // [0x18]+0x08
    };
    const mergeJALs = [
      0x0C03B666, // JAL 0x800ED998
      0x0C042307, // JAL 0x80108C1C
    ];

    let nextChain, nextSpace;

    if (hashEqual([dataView.buffer, info.offset, 0x08], hashes.START) &&
      mergeJALs.indexOf(dataView.getUint32(info.offset + 0x10)) >= 0 &&
      hashEqual([dataView.buffer, info.offset + 0x18, 0x08], hashes.END)) {
      // Read the chain we are going to.
      nextChain = dataView.getUint16(info.offset + 0x0E);
      nextChain = nextChain > 1000 ? 0 : nextChain; // R0 will be 0x2821 - just check for "way to big".

      // Read the offset into the chain.
      if (dataView.getUint16(info.offset + 0x14) === 0) // Usually this is an add with R0.
        nextSpace = info.chains[nextChain][0];
      else
        nextSpace = info.chains[nextChain][dataView.getUint16(info.offset + 0x16)];

      // This isn't an event really - write directly to the board links.
      if (!isNaN(nextSpace)) {
        // I think this tries to prevent reading the "reverse" event...
        if (info.board.links.hasOwnProperty(info.curSpace)) {
          return false;
        }

        PP64.boards.addConnection(info.curSpace, nextSpace, info.board);
      }

      // Cache the ASM so we can write this event later.
      let cacheEntry = EventCache.get(ChainMerge.id) || {};
      if (!cacheEntry[info.game]) {
        // Save the whole little function, but clear the argument values.
        cacheEntry[info.game] = {
          asm: dataView.buffer.slice(info.offset, info.offset + 0x24)
        };
        let cacheView = new DataView(cacheEntry[info.game].asm);
        cacheView.setUint32(0x08, 0); // Blank the A0, A1, and A2 ADDIUs
        cacheView.setUint32(0x0C, 0);
        cacheView.setUint32(0x14, 0);
        EventCache.set(ChainMerge.id, cacheEntry);
      }
      return true;
    }
    return false;
  };

  const ChainSplit = PP64.adapters.events.getEvent("CHAINSPLIT");
  ChainSplit._parse3 = function(dataView, info) {
    let hashes = {
      // From Chilly Waters 0x80108D28 / 0x31E898:
      METHOD_START: "16092DD153432852C141C78807ECCBF0", // +0x08
      METHOD_END: "6FF6DF70CDC85862F8F129303009A544", // [0x24]+0x14
    };

    // Match a few sections to see if we match.
    if (hashEqual([dataView.buffer, info.offset, 0x08], hashes.METHOD_START) &&
        hashEqual([dataView.buffer, info.offset + 0x24, 0x14], hashes.METHOD_END)) {
      // Read the RAM offset of the space index arguments.
      let upperAddr = dataView.getUint16(info.offset + 0x0A) << 16;
      let lowerAddr = dataView.getUint16(info.offset + 0x0E);
      let spacesAddr = (upperAddr | lowerAddr) & 0x7FFFFFFF;
      if (spacesAddr & 0x00008000)
        spacesAddr = spacesAddr - 0x00010000;
      let spacesOffset = info.offset - (info.addr - spacesAddr);

      let destinationSpace = dataView.getUint16(spacesOffset);
      while (destinationSpace !== 0xFFFF) {
        PP64.boards.addConnection(info.curSpace, destinationSpace, info.board);
        spacesOffset += 2;
        destinationSpace = dataView.getUint16(spacesOffset);
      }

      let cacheEntry = EventCache.get(ChainSplit.id);
      if (!cacheEntry)
        cacheEntry = {};
      if (!cacheEntry[info.game])
        cacheEntry[info.game] = {};
      if (!cacheEntry[info.game].asm) {
        cacheEntry[info.game].asm = dataView.buffer.slice(info.offset, info.offset + 0x38);
        let cacheView = new DataView(cacheEntry[info.game].asm);
        cacheView.setUint32(0x08, 0); // Blank the A0 load.
        cacheView.setUint32(0x0C, 0);
        cacheView.setUint32(0x10, 0); // Blank the A1 load.
        cacheView.setUint32(0x14, 0);
        cacheView.setUint32(0x18, 0); // Blank the A2 load.
        cacheView.setUint32(0x20, 0);
      }

      EventCache.set(ChainSplit.id, cacheEntry);

      return true;
    }

    return false;
  }
  ChainSplit._write3 = function(dataView, event, info, temp) {
    let cacheEntry = EventCache.get(ChainSplit.id);
    if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm)
      throw `Cannot write ${ChainSplit.id}, missing cache entry values.`;

    let asm = cacheEntry[info.game].asm;
    PP64.utils.arrays.copyRange(dataView, asm, 0, 0, asm.byteLength);

    let [argsAddrUpper, argsAddrLower] = $MIPS.getRegSetUpperAndLower(info.argsAddr);
    dataView.setUint32(0x08, $MIPS.makeInst("LUI", $MIPS.REG.A0, argsAddrUpper));
    dataView.setUint32(0x0C, $MIPS.makeInst("ADDIU", $MIPS.REG.A0, $MIPS.REG.A0, argsAddrLower));

    [argsAddrUpper, argsAddrLower] = $MIPS.getRegSetUpperAndLower(info.argsAddr + 0x14);
    dataView.setUint32(0x10, $MIPS.makeInst("LUI", $MIPS.REG.A1, argsAddrUpper));
    dataView.setUint32(0x14, $MIPS.makeInst("ADDIU", $MIPS.REG.A1, $MIPS.REG.A1, argsAddrLower));

    // Not sure what A2 is, but it seems to be fine if it is equal to an address containing 0.
    dataView.setUint32(0x18, $MIPS.makeInst("LUI", $MIPS.REG.A2, 0x8000));
    dataView.setUint32(0x20, $MIPS.makeInst("ADDIU", $MIPS.REG.A2, $MIPS.REG.A2, 0x00A0));

    if (event._reverse) { // Blank out the extra JAL we don't do when reversing.
      dataView.setUint32(0x24, 0);
      dataView.setUint32(0x28, 0);
    }

    return [info.offset, asm.byteLength];
  };

  // When going in reverse, there can be splits where there otherwise was only
  // chain merges going forward. The game basically wraps a chain split with a
  // small function that checks if the player is going in reverse.
  const ReverseChainSplit = PP64.adapters.events.createEvent("REVERSECHAINSPLIT", "");
  ReverseChainSplit.fakeEvent = true;
  ReverseChainSplit.activationType = $activationType.WALKOVER;
  ReverseChainSplit.mystery = 1; // Notable difference
  ReverseChainSplit.supportedGameVersions = [3];
  ReverseChainSplit.supportedGames = [
    $gameType.MP3_USA,
  ];
  ReverseChainSplit.parse = function(dataView, info) {
    let hashes = {
      REVERSE_FILTER: "0909C95D982B8A9B1F096AC54FFFB816"
    };

    if (!hashEqual([dataView.buffer, info.offset, 0x30], hashes.REVERSE_FILTER))
      return false;

    // Get the JAL to the Chain Split.
    let jalChainSplit = dataView.getUint32(info.offset + 0x30);

    // Cache the wrapper function ASM so we can write this event later.
    let cacheEntry = EventCache.get(ReverseChainSplit.id) || {};
    if (!cacheEntry[info.game]) {
      cacheEntry[info.game] = {
        asm: dataView.buffer.slice(info.offset, info.offset + $MIPS.getFunctionLength(dataView, info.offset))
      };
      let cacheView = new DataView(cacheEntry[info.game].asm);
      EventCache.set(ReverseChainSplit.id, cacheEntry);
    }

    // We don't need to do anything aside from caching the helper function.
    return true;
  }
  ReverseChainSplit.write = function(dataView, event, info, temp) {
    let cacheEntry = EventCache.get(ReverseChainSplit.id);
    if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm)
      throw `Cannot write ${ReverseChainSplit.id}, missing cache entry values.`;

    // Basically, we want to just write a normal ChainSplit, but then write
    // the wrapper and point to that as the actual event.
    event._reverse = true;
    let [splitOffset, splitLen] = ChainSplit._write3(dataView, event, info, temp);

    // Now write the wrapper.
    let asm = cacheEntry[info.game].asm;
    PP64.utils.arrays.copyRange(dataView, asm, splitLen, 0, asm.byteLength);

    // Patch wrapper to JAL ChainSplit
    let jalAddr = info.addr & 0x7FFFFFFF; // This is still pointing at the ChainSplit
    dataView.setUint32(splitLen + 0x30, $MIPS.makeInst("JAL", jalAddr));

    return [info.offset + splitLen, splitLen + asm.byteLength];
  };

  const StarEvent = PP64.adapters.events.getEvent("STAR");
  StarEvent._parse3 = function(dataView, info) {
    let hashes = {
      CHILLY: "E9B6C28983AAE724AC187EA8E0CBC79D" // 0x8010A4B4 - 0x8010A860 (0x00320024 - 0x003203d0)
    };

    if (hashEqual([dataView.buffer, info.offset, 0x3BC], hashes.CHILLY)) {
      return true;
    }

    return false;
  }
  StarEvent._write3 = function(dataView, event, info, temp) {
    // Just point to the event because we left it alone.
    return [0x00320024, 0];
  };

  const BooEvent = PP64.adapters.events.getEvent("BOO");
  BooEvent._parse3 = function(dataView, info) {
    let fnLen;
    let found = false;

    // Chilly Waters 0x8010DE7C - 0x10F050, space 0x92 with 0x6A boo
    if (info.boardIndex === 0) {
      if (info.offset !== 0x003239EC)
        return false;
      if (dataView.getUint32(info.offset + 0x4C) !== 0x0C03AF32) // JAL 0x800EBCC8
        return false;
      fnLen = $MIPS.getFunctionLength(dataView, info.offset);
      found = fnLen === 0x11D4;
    }

    // Deep bloober 0x8010D9E4, space 0x79 with 0x66 boo

    if (!found)
      return false;

    // let cacheEntry = EventCache.get(BooEvent.id);
    // if (!cacheEntry)
    //   cacheEntry = {};
    // if (!cacheEntry[info.game])
    //   cacheEntry[info.game] = {};
    // if (!cacheEntry[info.game][info.boardIndex])
    //   cacheEntry[info.game][info.boardIndex] = {};
    // if (!cacheEntry[info.game][info.boardIndex].asm) {
    //   cacheEntry[info.game][info.boardIndex].asm = dataView.buffer.slice(info.offset, info.offset + fnLen);
    //   //let cacheView = new DataView(cacheEntry[info.game].asm);
    // }

    // EventCache.set(BooEvent.id, cacheEntry);

    return true;
  }
  BooEvent._write3 = function(dataView, event, info, temp) {
    // Just point to the event because we left it there.
    if (info.boardIndex === 0) {
      let romView = PP64.romhandler.getDataView();
      romView.setUint16(0x003239EC + 0xBE, info.curSpaceIndex); // 0x8010DF38

      // Find the closest (probably only) boo space nearby.
      let booSpaces = PP64.boards.getSpacesOfSubType($spaceSubType.BOO, info.board);
      let eventSpace = info.curSpace;
      let bestDistance = Number.MAX_VALUE;
      let bestBooIdx = info.board._deadSpace;
      for (let b = 0; b < booSpaces.length; b++) {
        let booIdx = booSpaces[b];
        let booSpace = info.board.spaces[booIdx];
        let dist = PP64.utils.number.distance(eventSpace.x, eventSpace.y, booSpace.x, booSpace.y);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestBooIdx = booIdx;
        }
      }

      romView.setUint16(0x003239EC + 0x13E, bestBooIdx);
      romView.setUint16(0x003239EC + 0x14A, bestBooIdx);

      return [0x003239EC, 0];
    }

    throw "Can't write Boo to board index " + info.boardIndex;
  };

  const Bank = PP64.adapters.events.getEvent("BANK");
  Bank._parse3 = function(dataView, info) {
    let hashes = {
      // A good chunk...
      CHILLY: "FCA0025616E8B2BE4CD60F47EE60DC30" // 0x8010A860 - 0x8010B394 (0x3203D0 ...)
    };

    if (hashEqual([dataView.buffer, info.offset, 0xB4], hashes.CHILLY)) {
      return true;
    }

    return false;
  }
  Bank._write3 = function(dataView, event, info, temp) {
    let curBank = temp.curBank = temp.curBank || 1;
    temp.curBank++;

    // Find the closest Bank subtype space nearby.
    let bankSpaces = PP64.boards.getSpacesOfSubType($spaceSubType.BANK, info.board);
    let eventSpace = info.curSpace;
    let bestDistance = Number.MAX_VALUE;
    let bestBankIdx = info.board._deadSpace;
    for (let b = 0; b < bankSpaces.length; b++) {
      let bankIdx = bankSpaces[b];
      let bankSpace = info.board.spaces[bankIdx];
      let dist = PP64.utils.number.distance(eventSpace.x, eventSpace.y, bankSpace.x, bankSpace.y);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestBankIdx = bankIdx;
      }
    }

    if (info.boardIndex === 0) {
      let romView = PP64.romhandler.getDataView();

      if (curBank === 1) {
        // The current space
        romView.setUint16(0x003203D0 + 0x8A, info.curSpaceIndex); // 0x8010A8E8
        romView.setUint16(0x003203D0 + 0xDA, info.curSpaceIndex); // 0x8010A938

        // The bank's space
        romView.setUint16(0x003203D0 + 0xCA, bestBankIdx); // 0x8010A928
        romView.setUint16(0x003203D0 + 0xD2, bestBankIdx); // 0x8010A930
      }
      else if (curBank === 2) {
        // The current space
        romView.setUint16(0x003203D0 + 0x92, info.curSpaceIndex); // 0x8010A8F0
        romView.setUint16(0x003203D0 + 0xBA, info.curSpaceIndex); // 0x8010A918

        // The bank's space
        romView.setUint16(0x003203D0 + 0xA6, bestBankIdx); // 0x8010A904
        romView.setUint16(0x003203D0 + 0xAE, bestBankIdx); // 0x8010A90C
      }

      // Just point to the event because we left it alone.
      return [0x003203D0, 0];
    }

    throw "Can't write Bank to board index " + info.boardIndex;
  };

  const ItemShop = PP64.adapters.events.getEvent("ITEMSHOP");
  ItemShop._parse3 = function(dataView, info) {
    let fnLen;
    let found = false;

    // Chilly Waters 0x8010B65C - , spaces 0x7C,0x77 with 0x6E,0x73
    if (info.boardIndex === 0) {
      if (info.offset !== 0x003211CC)
        return false;
      if (dataView.getUint32(info.offset + 0x44) !== 0x0C03C84F) // JAL 0x800F213C
        return false;
      // fnLen = $MIPS.getFunctionLength(dataView, info.offset);
      // found = fnLen === ;
      found = true;
    }

    if (!found)
      return false;

    return true;
  }
  ItemShop._write3 = function(dataView, event, info, temp) {
    let curItemShop = temp.curItemShop = temp.curItemShop || 1;
    temp.curItemShop++;

    // Find the closest Item shop subtype space nearby.
    let itemShopSpaces = PP64.boards.getSpacesOfSubType($spaceSubType.ITEMSHOP, info.board);
    let eventSpace = info.curSpace;
    let bestDistance = Number.MAX_VALUE;
    let bestItemShopIdx = info.board._deadSpace;
    for (let b = 0; b < itemShopSpaces.length; b++) {
      let shopIdx = itemShopSpaces[b];
      let shopSpace = info.board.spaces[shopIdx];
      let dist = PP64.utils.number.distance(eventSpace.x, eventSpace.y, shopSpace.x, shopSpace.y);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestItemShopIdx = shopIdx;
      }
    }

    if (info.boardIndex === 0) {
      let romView = PP64.romhandler.getDataView();

      if (curItemShop === 1) {
        // The current space
        romView.setUint16(0x003211CC + 0xA2, info.curSpaceIndex); // 0x8010B6FC
        romView.setUint16(0x003211CC + 0xD6, info.curSpaceIndex); // 0x8010B730

        // The shop's space
        romView.setUint16(0x003211CC + 0xBE, bestItemShopIdx); // 0x8010B718
        romView.setUint16(0x003211CC + 0xCA, bestItemShopIdx); // 0x80801724
      }
      else if (curItemShop === 2) {
        // The current space
        romView.setUint16(0x003211CC + 0xAA, info.curSpaceIndex); // 0x8010B704
        romView.setUint16(0x003211CC + 0xFE, info.curSpaceIndex); // 0x8010B758

        // The shop's space
        romView.setUint16(0x003211CC + 0xB2, bestItemShopIdx); // 0x8010B70C
        romView.setUint16(0x003211CC + 0xF2, bestItemShopIdx); // 0x8010B74C
      }

      // Just point to the event because we left it alone.
      return [0x003211CC, 0];
    }

    throw "Can't write Item Shop to board index " + info.boardIndex;
  };
})();
