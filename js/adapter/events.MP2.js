PP64.ns("adapters.events");

PP64.adapters.events.MP2 = (function() {
  const hashEqual = PP64.utils.arrays.hashEqual;
  const EventCache = PP64.adapters.events.EventCache;

  const ChainSplit = PP64.adapters.events.getEvent("CHAINSPLIT");
  ChainSplit._parse2 = function(dataView, info) {
    let hashes = {
      // From Western Land 0x80107C54 / 0x29CF24:
      METHOD_START: "0C01A009C54E209652DA667F464FB7C0", // +0x2C
      //METHOD_MID1: "", // [0x30]+0x18 // Not sure why this was hashed in MP1
      METHOD_MID2: "FC606B8F8BD2C8D39BB9581B0E4D8398", // [0x4C]+0x1C
      METHOD_END: "2F3A0045D0AC927FF23ACD73B5B62E1C" // [0xF0]+0x28
    };

    // Match a few sections to see if we match.
    if (hashEqual([dataView.buffer, info.offset, 0x2C], hashes.METHOD_START) &&
        //hashEqual([dataView.buffer, info.offset + 0x30, 0x18], hashes.METHOD_MID1) &&
        hashEqual([dataView.buffer, info.offset + 0x4C, 0x1C], hashes.METHOD_MID2) &&
        hashEqual([dataView.buffer, info.offset + 0xF0, 0x28], hashes.METHOD_END)) {
      // Read the chain indices.
      let leftChain = dataView.getUint16(info.offset + 0xEA);
      let rightChain = dataView.getUint16(info.offset + 0xEE);

      let leftSpace = info.chains[leftChain][0]; // Technically, we should check if A2 is really R0.
      let rightSpace = info.chains[rightChain][0];

      PP64.boards.addConnection(info.curSpace, leftSpace, info.board);
      PP64.boards.addConnection(info.curSpace, rightSpace, info.board);

      let cacheEntry = EventCache.get(ChainSplit.id);
      if (!cacheEntry)
        cacheEntry = {};
      if (!cacheEntry[info.game])
        cacheEntry[info.game] = {};
      if (!cacheEntry[info.game].asm) {
        cacheEntry[info.game].asm = dataView.buffer.slice(info.offset, info.offset + 0x118);
        let cacheView = new DataView(cacheEntry[info.game].asm);
        cacheView.setUint32(0x2C, 0); // Blank the helper1 call.
        cacheView.setUint32(0xD4, 0); // Blank the helper2 call.
        cacheView.setUint32(0x40, 0); // Blank the space args LUI.
        cacheView.setUint32(0x48, 0); // Blank the space args ADDIU.
        cacheView.setUint16(0xE4, 0); // Blank the +3 jump.
        cacheView.setUint16(0xEA, 0); // Blank the left chain index.
        cacheView.setUint16(0xEE, 0); // Blank the right chain index.
      }
      if (!cacheEntry[info.game].helper1) {
        cacheEntry[info.game].helper1 = [];
        let helper1JAL = dataView.getUint32(info.offset + 0x2C);
        let helper1Addr = $MIPS.getJALAddr(helper1JAL);
        //console.log(helper1Addr.toString(16));
        let helper1Offset = info.offset - (info.addr - helper1Addr); // Assumes helper comes before.
        //console.log(helper1Offset.toString(16));
        cacheEntry[info.game].helper1[info.boardIndex] = dataView.buffer.slice(helper1Offset, helper1Offset + 0xD0);

        cacheEntry[info.game].helper2 = [];
        let helper2JAL = dataView.getUint32(info.offset + 0xD4);
        let helper2Addr = $MIPS.getJALAddr(helper2JAL);
        //console.log(helper1Addr.toString(16));
        let helper2Offset = info.offset - (info.addr - helper2Addr); // Assumes helper comes before.
        //console.log(helper1Offset.toString(16));
        cacheEntry[info.game].helper2[info.boardIndex] = dataView.buffer.slice(helper2Offset, helper2Offset + 0x60);
      }

      EventCache.set(ChainSplit.id, cacheEntry);

      return true;
    }

    return false;
  }

  const StarEvent = PP64.adapters.events.getEvent("STAR");
  StarEvent._parse2 = function(dataView, info) {
    let hashes = {
      WESTERN: "D52AD53C2FED642C3001C3579B4299C3" // 0x29E0DC - 0x29E91C ROM
    };

    if (hashEqual([dataView.buffer, info.offset, 0x840], hashes.WESTERN)) {
      return true;
    }

    return false;
  }
  StarEvent._write2 = function(dataView, event, info, temp) {
    // Just point to the event because we left it alone.
    return [0x29E0DC, 0];
  };

  const BooEvent = PP64.adapters.events.getEvent("BOO");
  BooEvent._parse2 = function(dataView, info) {
    let fnLen;
    let found = false;

    // Western Land 0x10BA48 - 0x8010C44C, spaces 0xAF,0xB4 with boos 0x9D,0x9F
    if (info.boardIndex === 0) {
      if (info.offset !== 0x002A0D18)
        return false;
      //if (dataView.getUint32(info.offset + 0x4C) !== 0x0C03AF32) // JAL 0x800EBCC8
      //  return false;
      //fnLen = $MIPS.getFunctionLength(dataView, info.offset);
      //found = fnLen === 0x11D4;
      found = true;
    }

    if (!found)
      return false;

    return true;
  }
  BooEvent._write2 = function(dataView, event, info, temp) {
    let curBoo = temp.curBoo = temp.curBoo || 1;
    temp.curBoo++;

    // Find the closest (probably only) boo space nearby.
    let booSpaces = PP64.boards.getSpacesOfSubType($spaceSubType.BOO, info.board);
    let eventSpace = info.curSpace;
    let bestDistance = Number.MAX_VALUE;
    let bestBooIdx = info.curSpaceIndex;
    for (let b = 0; b < booSpaces.length; b++) {
      let booIdx = booSpaces[b];
      let booSpace = info.board.spaces[booIdx];
      let dist = PP64.utils.number.distance(eventSpace.x, eventSpace.y, booSpace.x, booSpace.y);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestBooIdx = booIdx;
      }
    }

    if (info.boardIndex === 0) {
      let romView = PP64.romhandler.getDataView();

      if (curBoo === 1) {
        romView.setUint16(0x002A0D18 + 0x82, info.curSpaceIndex); // 0x1010BAC8
        romView.setUint16(0x002A0D18 + 0xA6, bestBooIdx); // 0x8010BAEC
      }
      else if (curBoo === 2) {
        romView.setUint16(0x002A0D18 + 0x8A, info.curSpaceIndex); // 0x8010BAD0
        romView.setUint16(0x002A0D18 + 0xAE, bestBooIdx); // 0x8010BAF4
      }

      // Just point to the event because we left it there.
      return [0x002A0D18, 0];
    }

    throw "Can't write Boo to board index " + info.boardIndex;
  };

  const Bank = PP64.adapters.events.getEvent("BANK");
  Bank._parse2 = function(dataView, info) {
    let fnLen;
    let found = false;

    // Western Land 0x8010964C - 0x80109A70, spaces 0x5E,0x8A with banks 0x9B,0x99
    if (info.boardIndex === 0) {
      if (info.offset !== 0x0029E91C)
        return false;
      //if (dataView.getUint32(info.offset + 0x44) !== 0x0C03C84F)
      //  return false;
      // fnLen = $MIPS.getFunctionLength(dataView, info.offset);
      // found = fnLen === ;
      found = true;
    }

    if (!found)
      return false;

    return true;
  }
  Bank._write2 = function(dataView, event, info, temp) {
    let curBank = temp.curBank = temp.curBank || 1;
    temp.curBank++;

    // Find the closest Bank subtype space nearby.
    let bankSpaces = PP64.boards.getSpacesOfSubType($spaceSubType.BANK, info.board);
    let eventSpace = info.curSpace;
    let bestDistance = Number.MAX_VALUE;
    let bestBankIdx = info.curSpaceIndex;
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
        romView.setUint16(0x0029E91C + 0x6A, info.curSpaceIndex); // 0x801096B4

        // The bank's space
        romView.setUint16(0x0029E91C + 0x92, bestBankIdx); // 0x801096DC
      }
      else if (curBank === 2) {
        // The current space
        romView.setUint16(0x0029E91C + 0x72, info.curSpaceIndex); // 0x801096BC

        // The bank's space
        romView.setUint16(0x0029E91C + 0x86, bestBankIdx); // 0x801096D0
      }

      // Just point to the event because we left it alone.
      return [0x0029E91C, 0];
    }

    throw "Can't write Bank to board index " + info.boardIndex;
  };

  const ItemShop = PP64.adapters.events.getEvent("ITEMSHOP");
  ItemShop._parse2 = function(dataView, info) {
    let fnLen;
    let found = false;

    // Western Land 0x80109B30 - 0x8010A13C, space 0xA7 with shop at 0x9A
    if (info.boardIndex === 0) {
      if (info.offset !== 0x0029EE00)
        return false;
      //if (dataView.getUint32(info.offset + 0x44) !== 0x0C03C84F)
      //  return false;
      // fnLen = $MIPS.getFunctionLength(dataView, info.offset);
      // found = fnLen === ;
      found = true;
    }

    if (!found)
      return false;

    return true;
  }
  ItemShop._write2 = function(dataView, event, info, temp) {
    let curItemShop = temp.curItemShop = temp.curItemShop || 1;
    temp.curItemShop++;

    // Find the closest Item shop subtype space nearby.
    let itemShopSpaces = PP64.boards.getSpacesOfSubType($spaceSubType.ITEMSHOP, info.board);
    let eventSpace = info.curSpace;
    let bestDistance = Number.MAX_VALUE;
    let bestItemShopIdx = info.curSpaceIndex;
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
        // The shop's space
        romView.setUint16(0x0029EE00 + 0x62, bestItemShopIdx); // 0x80109B90
      }

      // Just point to the event because we left it alone.
      return [0x0029EE00, 0];
    }

    throw "Can't write Item Shop to board index " + info.boardIndex;
  };

  return {
    getAvailableEvents: function() {
      let events = [];
      let _events = PP64.adapters.events.getEvents();
      for (let id in _events) {
        let event = _events[id];
        if (!event.unsupported && !event.fakeEvent)
          events.push(PP64.utils.obj.copy(event));
      }
      return events;
    },
  };

})();
