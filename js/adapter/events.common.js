PP64.ns("adapters");

PP64.adapters.events.common = (function() {
  const hashEqual = PP64.utils.arrays.hashEqual;
  const EventCache = PP64.adapters.events.EventCache;

  // Represents the "event" that takes the player from one chain to another.
  // This won't be an actual event when exposed to the user.
  const ChainMerge = PP64.adapters.events.createEvent("CHAINMERGE", "");
  ChainMerge.activationType = $activationType.WALKOVER;
  ChainMerge.mystery = 1;
  ChainMerge.fakeEvent = true;
  ChainMerge.supportedGameVersions = [1, 2, 3];
  ChainMerge.supportedGames = [
    $gameType.MP1_USA,
    $gameType.MP2_USA,
    $gameType.MP3_USA,
  ];
  ChainMerge.parse = function(dataView, info) {
    if (info.gameVersion === 3) {
      const eChainMerge = PP64.adapters.events.getEvent(ChainMerge.id);
      return eChainMerge._parse3(dataView, info);
    }

    const hashes = {
      // Same start and end hashes for MP1, MP2
      START: "d218c758ea3247b6e5ec2ae0c3568a92", // +0x0C
      END: "560c69d6e851f4a22984b74c660e8536", // [0x18/0x24]+0x0C

      EXTRA_CALL_START: "BABAF76D201027AE882BEB58BB38B4EB" // +0x18
    };

    let nextChain, nextSpace;

    // See if this is the the stock, inefficient method.
    if (hashEqual([dataView.buffer, info.offset, 0x0C], hashes.START)) { // First 3 instructions
      if (hashEqual([dataView.buffer, info.offset + 0x18, 0x0C], hashes.END)) { // Last 3 instructions
        // Read the chain we are going to.
        nextChain = dataView.getUint16(info.offset + 0x0E);
        nextChain = nextChain > 1000 ? 0 : nextChain; // R0 will be 0x2821 - just check for "way to big".

        // Read the offset into the chain.
        if (dataView.getUint16(info.offset + 0x14) === 0) // Usually this is an add with R0.
          nextSpace = info.chains[nextChain][0];
        else
          nextSpace = info.chains[nextChain][dataView.getUint16(info.offset + 0x16)];

        // This isn't an event really - write directly to the board links.
        if (!isNaN(nextSpace))
          PP64.boards.addConnection(info.curSpace, nextSpace, info.board);

        // Cache the ASM so we can write this event later.
        let cacheEntry = EventCache.get(ChainMerge.id) || {};
        if (!cacheEntry[info.game]) {
          // Save the whole little function, but clear the argument values.
          cacheEntry[info.game] = {
            asm: dataView.buffer.slice(info.offset, info.offset + 0x24)
          };
          let cacheView = new DataView(cacheEntry[info.game].asm);
          cacheView.setUint32(0x0C, 0); // Blank the two arg A1, A2 sets
          cacheView.setUint32(0x14, 0);
          EventCache.set(ChainMerge.id, cacheEntry);
        }

        return true;
      }
    }

    // There is another MP1 variation that sends A0 with something else than -1.
    if (hashEqual([dataView.buffer, info.offset, 0x18], hashes.EXTRA_CALL_START)) {
      if (hashEqual([dataView.buffer, info.offset + 0x24, 12], hashes.END)) { // Last 3 instructions
        // Read the chain we are going to.
        nextChain = dataView.getUint16(info.offset + 0x1A);
        nextChain = nextChain > 1000 ? 0 : nextChain; // R0 will be 0x2821 - just check for "way to big".

        // Read the offset into the chain.
        if (dataView.getUint16(info.offset + 0x20) === 0) // Usually this is an add with R0.
          nextSpace = info.chains[nextChain][0];
        else
          nextSpace = info.chains[nextChain][dataView.getUint16(info.offset + 0x22)];

        // This isn't an event really - write directly to the board links.
        if (!isNaN(nextSpace))
          info.board.links[info.curSpace] = nextSpace;

        return true;
      }
    }

    return false;
  };

  // TODO: We can do a O(1) + n/2 style improvement for this event.
  ChainMerge.write = function(dataView, event, info, temp) {
    let cacheEntry = EventCache.get(ChainMerge.id);
    if (!cacheEntry || !cacheEntry[info.game])
      throw `Cannot write ${ChainMerge.id}, no cache entry present.`;

    let asm = cacheEntry[info.game].asm;
    PP64.utils.arrays.copyRange(dataView, asm, 0, 0, asm.byteLength);
    if (info.gameVersion === 3) {
      dataView.setUint32(0x08, $MIPS.makeInst("ADDIU", $MIPS.REG.A0, $MIPS.REG.R0, event.prevSpace)); // Previous space

      // JAL handling, needs work... FIXME
      if (event.prevSpace === 0xFFFF)
        dataView.setUint32(0x10, 0x0C03B666);
      else if (info.boardIndex === 0)
        dataView.setUint32(0x10, 0x0C042307);
      else
        throw "ChainMerge for ${info.boardIndex} needs work";
    }
    dataView.setUint32(0x0C, $MIPS.makeInst("ADDIU", $MIPS.REG.A1, $MIPS.REG.R0, event.chain)); // Chain index
    dataView.setUint32(0x14, $MIPS.makeInst("ADDIU", $MIPS.REG.A2, $MIPS.REG.R0, event.spaceIndex || 0)); // Space index within chain.
    return [info.offset, 0x24];
  };
  ChainMerge.sizeOf = (n = 1) => n * 0x24;

  // Represents the "event" where the player decides between two paths.
  // This won't be an actual event when exposed to the user.
  const ChainSplit = PP64.adapters.events.createEvent("CHAINSPLIT", "");
  ChainSplit.activationType = $activationType.WALKOVER;
  ChainSplit.mystery = 2;
  ChainSplit.fakeEvent = true;
  ChainSplit.supportedGameVersions = [1, 2, 3];
  ChainSplit.supportedGames = [
    $gameType.MP1_USA,
    $gameType.MP2_USA,
    $gameType.MP3_USA,
  ];
  ChainSplit.parse = function(dataView, info) {
    let eChainSplit = PP64.adapters.events.getEvent(ChainSplit.id);
    switch (info.gameVersion) {
      case 1:
        return eChainSplit._parse1(dataView, info);
      case 2:
        return eChainSplit._parse2(dataView, info);
      case 3:
        return eChainSplit._parse3(dataView, info);
    }
    return false;
  };
  ChainSplit.write = function(dataView, event, info, temp) {
    if (info.gameVersion === 3) {
      let eChainSplit = PP64.adapters.events.getEvent(ChainSplit.id);
      return eChainSplit._write3(dataView, event, info, temp);
    }

    let cacheEntry = EventCache.get(ChainSplit.id);
    if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm || !cacheEntry[info.game].helper1 || !cacheEntry[info.game].helper2)
      throw `Cannot write ${ChainSplit.id}, missing cache entry values.`;

    let lenWritten = 0;
    let curAddr = info.addr & 0x7FFFFFFF; // No 0x8... in JALs

    let asm = cacheEntry[info.game].asm;
    PP64.utils.arrays.copyRange(dataView, asm, lenWritten, 0, asm.byteLength);
    lenWritten += asm.byteLength;

    // We need to write the helpers once, then we can reuse them later.
    if (!temp.helper1addr) {
      let helper1asm = cacheEntry[info.game].helper1[info.boardIndex];
      if (!helper1asm)
        throw `Cannot write ${ChainSplit.id}, missing helper1[${info.boardIndex}].`;

      PP64.utils.arrays.copyRange(dataView, helper1asm, lenWritten, 0, helper1asm.byteLength);
      temp.helper1addr = curAddr + lenWritten;
      lenWritten += helper1asm.byteLength;
    }
    if (!temp.helper2addr) {
      let helper2asm = cacheEntry[info.game].helper2[info.boardIndex];
      if (!helper2asm)
        throw `Cannot write ${ChainSplit.id}, missing helper2[${info.boardIndex}].`;

      PP64.utils.arrays.copyRange(dataView, helper2asm, lenWritten, 0, helper2asm.byteLength);
      temp.helper2addr = curAddr + lenWritten;
      lenWritten += helper2asm.byteLength;
    }

    let argsAddrLower = info.argsAddr & 0x0000FFFF;
    let argsAddrUpper = info.argsAddr >>> 16;
    if (argsAddrLower & 0x8000)
      argsAddrUpper += 1;

    switch(info.game) {
      case $gameType.MP1_USA:
      //case $gameType.MP1_JPN:
        dataView.setUint32(0x2C, $MIPS.makeInst("JAL", temp.helper1addr)); // Set the helper1 call.
        dataView.setUint32(0x40, $MIPS.makeInst("LUI", $MIPS.REG.A1, argsAddrUpper));
        dataView.setUint32(0x48, $MIPS.makeInst("ADDIU", $MIPS.REG.A1, $MIPS.REG.A1, argsAddrLower));
        dataView.setUint32(0xC4, $MIPS.makeInst("JAL", temp.helper2addr)); // Set the helper2 call.
        dataView.setUint32(0xD4, $MIPS.makeInst("J", curAddr + 0xE0)); // J +3
        dataView.setUint16(0xDA, event.chains[0]); // Set the left chain index.
        dataView.setUint16(0xDE, event.chains[1]); // Set the right chain index.
        break;
      case $gameType.MP2_USA:
        dataView.setUint32(0x2C, $MIPS.makeInst("JAL", temp.helper1addr)); // Set the helper1 call.
        dataView.setUint32(0x40, $MIPS.makeInst("LUI", $MIPS.REG.A1, argsAddrUpper));
        dataView.setUint32(0x48, $MIPS.makeInst("ADDIU", $MIPS.REG.A1, $MIPS.REG.A1, argsAddrLower));
        dataView.setUint32(0xD4, $MIPS.makeInst("JAL", temp.helper2addr)); // Set the helper2 call.
        dataView.setUint32(0xE4, $MIPS.makeInst("J", curAddr + 0xF0)); // J +3
        dataView.setUint16(0xEA, event.chains[0]); // Set the left chain index.
        dataView.setUint16(0xEE, event.chains[1]); // Set the right chain index.
        break;
      default:
        throw `Writing ChainSplit for unknown game`;
    }

    return [info.offset, lenWritten];
  };
  ChainSplit.sizeOf = (n = 1) => 0xB0 + 0x4C + n * 0x108; // Two helpers + main fn. // FIXME MP2

  const Boo = PP64.adapters.events.createEvent("BOO", "Visit Boo");
  Boo.activationType = $activationType.WALKOVER;
  Boo.mystery = 1;
  Boo.supportedGameVersions = [1, 2, 3];
  Boo.supportedGames = [
    $gameType.MP1_USA, $gameType.MP2_USA, $gameType.MP3_USA,
  ];
  Boo.parse = function(dataView, info) {
    const eBoo = PP64.adapters.events.getEvent(Boo.id);
    switch (info.gameVersion) {
      case 2:
        return eBoo._parse2(dataView, info);
      case 3:
        return eBoo._parse3(dataView, info);
    }

    let hashes = {
      // Single Boo hashes
      PLAYER_DIRECTION_CHANGE: "DAD5E635FE90ED982D02B3F1D5C0CE21", // +0x14
      METHOD_END: "FF104A680C0ECE615B5A24AD95A908CC", // [0x1C/0x54]+0x18

      // DK specific method
      DK_TWOBOO_METHOD_START: "94A87B51D2478E81AAC34F7D3C5C37F2", // +0x28
    };

    if (hashEqual([dataView.buffer, info.offset + 0x1C, 0x18], hashes.METHOD_END) &&
        hashEqual([dataView.buffer, info.offset, 0x14], hashes.PLAYER_DIRECTION_CHANGE)) {
      // Check whether this points to the Boo scene.
      let sceneNum = dataView.getUint16(info.offset + 0x1A);
      let match = sceneNum === 0x65;

      if (match) {
        let cacheEntry = EventCache.get(Boo.id);
        if (!cacheEntry) {
          // Save the whole function, but clear the argument values.
          cacheEntry = {
            asm: dataView.buffer.slice(info.offset, info.offset + 0x34)
          };
          let cacheView = new DataView(cacheEntry.asm);
          cacheView.setUint16(0x16, 0); // Blank the "face towards" space.
          EventCache.set(Boo.id, cacheEntry);
        }
      }

      return match;
    }
    else if (hashEqual([dataView.buffer, info.offset + 0x54, 0x18], hashes.METHOD_END) &&
        hashEqual([dataView.buffer, info.offset, 0x28], hashes.DK_TWOBOO_METHOD_START)) {
      return true; // We know this is stock DK board.
    }

    return false;
  };
  Boo.write = function(dataView, event, info, temp) {
    const eBooEvent = PP64.adapters.events.getEvent(Boo.id);
    switch (info.gameVersion) {
      // case 1:
      //   return eBooEvent._write1(dataView, event, info, temp);
      case 2:
        return eBooEvent._write2(dataView, event, info, temp);
      case 3:
        return eBooEvent._write3(dataView, event, info, temp);
    }

    let cacheEntry = EventCache.get(Boo.id);
    if (!cacheEntry)
      throw `Cannot write ${Boo.id}, no cache entry present.`;

    let asm = cacheEntry.asm;
    PP64.utils.arrays.copyRange(dataView, asm, 0, 0, asm.byteLength);
    // TODO: "Facing towards" space?
    // For now, blank out the facing towards.
    dataView.setUint32(8, 0);
    dataView.setUint32(12, 0);
    dataView.setUint32(16, 0);
    dataView.setUint32(20, 0);

    return [info.offset, 0x34];
  };
  Boo.sizeOf = (n = 1) => n * 0x34;

  const Bowser = PP64.adapters.events.createEvent("BOWSER", "Visit Bowser");
  Bowser.activationType = $activationType.WALKOVER;
  Bowser.mystery = 1;
  Bowser.supportedGameVersions = [1];
  Bowser.supportedGames = [
    $gameType.MP1_USA
  ];
  Bowser.parse = function(dataView, info) {
    let hashes = {
      PLAYER_DIRECTION_CHANGE: "DAD5E635FE90ED982D02B3F1D5C0CE21", // +0x14
      METHOD_END: "8A835D982BE35F1804E9ABD65C5699F4" // [0x1C]+0x1C
    };

    if (hashEqual([dataView.buffer, info.offset, 0x14], hashes.PLAYER_DIRECTION_CHANGE) &&
        hashEqual([dataView.buffer, info.offset + 0x1C, 0x1C], hashes.METHOD_END)) {
      // Check whether this points to any of the Bowser scenes.
      let sceneNum = dataView.getUint16(info.offset + 0x1A);
      let isBowserScene = [0x48, 0x49, 0x4F, 0x53, 0x54, 0x5B, 0x5D].indexOf(sceneNum) !== -1;

      if (isBowserScene) {
        let cacheEntry = EventCache.get(Bowser.id);
        if (!cacheEntry) {
          // Save the whole function, but clear the argument values.
          cacheEntry = {
            asm: dataView.buffer.slice(info.offset, info.offset + 0x38)
          };
          let cacheView = new DataView(cacheEntry.asm);
          cacheView.setUint32(0x08, 0); // Completely remove the "face towards" for now.
          cacheView.setUint32(0x0C, 0);
          cacheView.setUint32(0x10, 0);
          cacheView.setUint32(0x14, 0); // 0x16 is the actual space faced towards.
          cacheView.setUint32(0x1A, 0); // Blank the scene number.
          EventCache.set(Bowser.id, cacheEntry);
        }
      }

      return isBowserScene;
    }

    return false;
  };
  Bowser.write = function(dataView, event, info, temp) {
    let cacheEntry = EventCache.get(Bowser.id);
    if (!cacheEntry)
      throw `Cannot write ${Bowser.id}, no cache entry present.`;

    let asm = cacheEntry.asm;
    PP64.utils.arrays.copyRange(dataView, asm, 0, 0, asm.byteLength);

    // TODO: "Facing towards" space?

    // Any of these "work" but only the corresponding one has the right background.
    let bowserSceneNum = [0x48, 0x49, 0x4F, 0x53, 0x54, 0x5B, 0x5D][info.boardIndex];
    dataView.setUint16(0x1A, bowserSceneNum);

    return [info.offset, 0x38];
  };
  Bowser.sizeOf = (n = 1) => n * 0x38;

  const StarEvent = PP64.adapters.events.createEvent("STAR", "Buy star");
  StarEvent.activationType = $activationType.WALKOVER;
  StarEvent.mystery = 1;
  StarEvent.fakeEvent = true;
  StarEvent.supportedGameVersions = [1, 2, 3];
  StarEvent.supportedGames = [
    $gameType.MP1_USA,
    $gameType.MP2_USA,
    $gameType.MP3_USA,
  ];
  StarEvent.parse = function(dataView, info) {
    const eStarEvent = PP64.adapters.events.getEvent(StarEvent.id);
    switch (info.gameVersion) {
      case 1:
        return eStarEvent._parse1(dataView, info);
      case 2:
        return eStarEvent._parse2(dataView, info);
    }
    return false;
  };
  StarEvent.write = function(dataView, event, info, temp) {
    const eStarEvent = PP64.adapters.events.getEvent(StarEvent.id);
    switch (info.gameVersion) {
      case 1:
        return eStarEvent._write1(dataView, event, info, temp);
      case 2:
        return eStarEvent._write2(dataView, event, info, temp);
      case 3:
        return eStarEvent._write3(dataView, event, info, temp);
    }
    return false;
  };
  StarEvent.sizeOf = (n = 1) => 0x64;

  const ChanceTime = PP64.adapters.events.createEvent("CHANCETIME", "Chance Time");
  ChanceTime.activationType = $activationType.LANDON;
  ChanceTime.mystery = 1;
  ChanceTime.supportedGameVersions = [1];
  ChanceTime.supportedGames = [
    $gameType.MP1_USA,
  ];
  ChanceTime.parse = function(dataView, info) {
    let hashes = {
      // Peach hash, 0x24699C
      METHOD: "18F44B4AA1F4AAAA839C100E3B0FD863", // +0x6C
    };

    if (hashEqual([dataView.buffer, info.offset, 0x6C], hashes.METHOD)) {
      let cacheEntry = EventCache.get(ChanceTime.id);
      if (!cacheEntry) {
        // Save the whole function.
        cacheEntry = {
          asm: dataView.buffer.slice(info.offset, info.offset + 0x6C)
        };
        EventCache.set(ChanceTime.id, cacheEntry);
      }

      return true;
    }

    return false;
  };
  ChanceTime.write = function(dataView, event, info, temp) {
    let cacheEntry = EventCache.get(ChanceTime.id);
    if (!cacheEntry)
      throw `Cannot write ${ChanceTime.id}, no cache entry present.`;

    // Re-use a single chance time event.
    if (temp.writtenOffset)
      return [temp.writtenOffset, 0];

    let asm = cacheEntry.asm;
    PP64.utils.arrays.copyRange(dataView, asm, 0, 0, asm.byteLength);

    temp.writtenOffset = info.offset;
    return [info.offset, 0x6C];
  };
  ChanceTime.sizeOf = (n = 1) => 0x6C;

  const Bank = PP64.adapters.events.createEvent("BANK", "Visit Bank");
  Bank.activationType = $activationType.WALKOVER;
  Bank.mystery = 1;
  Bank.supportedGameVersions = [2, 3];
  Bank.supportedGames = [
    $gameType.MP2_USA,
    $gameType.MP3_USA,
  ];
  Bank.parse = function(dataView, info) {
    const eBank = PP64.adapters.events.getEvent(Bank.id);
    switch (info.gameVersion) {
      case 1:
        return false;
      case 2:
        return eBank._parse2(dataView, info);
      case 3:
        return eBank._parse3(dataView, info);
    }
    return false;
  };
  Bank.write = function(dataView, event, info, temp) {
    const eBank = PP64.adapters.events.getEvent(Bank.id);
    switch (info.gameVersion) {
      case 1:
        return false;
      case 2:
        return eBank._write2(dataView, event, info, temp);
      case 3:
        return eBank._write3(dataView, event, info, temp);
    }
    return false;
  };
  Bank.sizeOf = (n = 1) => 0; // TODO or not TODO

  const ItemShop = PP64.adapters.events.createEvent("ITEMSHOP", "Visit Item Shop");
  ItemShop.activationType = $activationType.WALKOVER;
  ItemShop.mystery = 1;
  ItemShop.supportedGameVersions = [2, 3];
  ItemShop.supportedGames = [
    $gameType.MP2_USA,
    $gameType.MP3_USA,
  ];
  ItemShop.parse = function(dataView, info) {
    const eItemShop = PP64.adapters.events.getEvent(ItemShop.id);
    switch (info.gameVersion) {
      case 1:
        return false;
      case 2:
        return eItemShop._parse2(dataView, info);
      case 3:
        return eItemShop._parse3(dataView, info);
    }
    return false;
  };
  ItemShop.write = function(dataView, event, info, temp) {
    const eItemShop = PP64.adapters.events.getEvent(ItemShop.id);
    switch (info.gameVersion) {
      case 1:
        return false;
      case 2:
        return eItemShop._write2(dataView, event, info, temp);
      case 3:
        return eItemShop._write3(dataView, event, info, temp);
    }
    return false;
  };
  ItemShop.sizeOf = (n = 1) => 0; // TODO or not TODO

  const Gate = PP64.adapters.events.createEvent("GATE", "Skeleton Key Gate");
  Gate.activationType = $activationType.WALKOVER;
  Gate.mystery = 2;
  Gate.fakeEvent = true;
  Gate.supportedGameVersions = [3];
  Gate.supportedGames = [
    //$gameType.MP2_USA,
    $gameType.MP3_USA,
  ];
  Gate.parse = function(dataView, info) {
    const eGate = PP64.adapters.events.getEvent(Gate.id);
    switch (info.gameVersion) {
      case 1:
        return false;
      case 2:
        return eGate._parse2(dataView, info);
      case 3:
        return eGate._parse3(dataView, info);
    }
    return false;
  };
  Gate.write = function(dataView, event, info, temp) {
    const eGate = PP64.adapters.events.getEvent(Gate.id);
    switch (info.gameVersion) {
      case 1:
        return false;
      case 2:
        return eGate._write2(dataView, event, info, temp);
      case 3:
        return eGate._write3(dataView, event, info, temp);
    }
    return false;
  };
  Gate.sizeOf = (n = 1) => 0; // TODO or not TODO

  return {};
})();
