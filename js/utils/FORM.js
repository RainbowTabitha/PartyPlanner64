PP64.ns("utils");

// This is most likely a packaging format for 3D models.
PP64.utils.FORM = class FORM {
  static unpack(formView) {
    if (!(formView instanceof DataView))
      formView = new DataView(formView);

    if (!PP64.utils.FORM.isForm(formView))
      return null;

    let formObj = Object.create(null);
    formObj.entries = [];

    let curOffset = 8;
    while (curOffset < formView.byteLength - 2) { // Roughly-ish the end
      let type = formView.getUint32(curOffset);
      type = PP64.utils.string.fromU32(type);
      if (type === "HBIN") {
        curOffset += 4;
        type += PP64.utils.string.fromU32(formView.getUint32(curOffset)); // "MODE"
      }

      formObj.entries.push(type);

      curOffset += 4;
      let len = formView.getUint32(curOffset);
      curOffset += 4;

      let entry = {
        raw: formView.buffer.slice(curOffset, curOffset + len)
      };

      let parsed = PP64.utils.FORM.parseType(type, entry.raw);
      if (parsed)
        entry.parsed = parsed;

      formObj[type] = formObj[type] || [];
      formObj[type].push(entry);

      curOffset += len + (len % 2);
    }

    // With all BMPs and PALs parsed, now we can decode the BMPs.
    if (formObj.BMP1 && formObj.PAL1) {
      if (formObj.BMP1.length !== formObj.PAL1.length) {
        $$log("FORM: BMP1 and PAL1 counts don't match.");
      }
      else {
        for (let i = 0; i < formObj.BMP1.length; i++) {
          let bmpEntry = formObj.BMP1[i];
          bmpEntry.parsed = PP64.utils.FORM.parseBMP(bmpEntry.raw, formObj.PAL1[i].parsed);
        }
      }
    }

    return formObj;
  }

  static pack(formObj) {
    let formBuffer = new ArrayBuffer(PP64.utils.FORM.getByteLength(formObj));
    let formView = new DataView(formBuffer);

    formView.setUint32(0, 0x464F524D); // "FORM"
    formView.setUint32(4, formBuffer.byteLength - 8); // Don't count the "FORM____" at the top.

    let entryWriteState = {};
    let curIndex = 8;
    for (let i = 0; i < formObj.entries.length; i++) {
      let entryType = formObj.entries[i];
      let entryNum = entryWriteState[entryType] || 0;
      entryWriteState[entryType] = entryNum + 1;

      // Write the type name.
      let typeBytes = PP64.utils.string.toCharCodes(entryType);
      for (let b = 0; b < typeBytes.length; b++) {
        formView.setUint8(curIndex, typeBytes[b]);
        curIndex++;
      }

      let entry = formObj[entryType][entryNum];

      // Write the entry length.
      let entrySize = entry.raw.byteLength;
      formView.setUint32(curIndex, entrySize);
      curIndex += 4;

      // Copy in the actual data.
      PP64.utils.arrays.copyRange(formView, entry.raw, curIndex, 0, entrySize);
      curIndex += entrySize + (entrySize % 2);
    }

    return formBuffer;
  }

  static isForm(viewOrBuffer) {
    if (!viewOrBuffer)
      return false;

    if (!(viewOrBuffer instanceof DataView))
      viewOrBuffer = new DataView(viewOrBuffer);

    return viewOrBuffer.getUint32(0) === 0x464F524D; // "FORM"
  }

  static getByteLength(formObj) {
    let byteLen = 0;
    for (let type in formObj) {
      if (type === "entries")
        continue;
      for (let i = 0; i < formObj[type].length; i++) {
        let rawLen = formObj[type][i].raw.byteLength;
        // The raw data + rounded up to 16-bit boundary + the TYPE text + entry length value.
        byteLen += rawLen + (rawLen % 2) + type.length + 4;
      }
    }
    return byteLen + 8; // Add the "FORM____" at the beginning.
  }

  static parseType(type, raw) {
    switch (type) {
      case "OBJ1":
        return PP64.utils.FORM.parseOBJ1(raw);
      case "COL1":
        return PP64.utils.FORM.parseCOL1(raw);
      case "VTX1":
        return PP64.utils.FORM.parseVTX1(raw);
      case "FAC1":
        return PP64.utils.FORM.parseFAC1(raw);
      case "PAL1":
        return PP64.utils.FORM.parsePAL1(raw);
      case "STRG":
        return PP64.utils.FORM.parseSTRG(raw);
    }

    return null;
  }

  static parseOBJ1(raw) {
    let rawView = new DataView(raw);
    let result = {
      objects: [],
      mystery1: rawView.getUint16(2),
    };

    let objCount = rawView.getUint16(0);
    let objectOffset = 4;
    for (let i = 0; i < objCount; i++) {
      let objSize = rawView.getUint16(objectOffset);
      let objType = rawView.getUint8(objectOffset + 2);

      let objIndex = rawView.getUint16(objectOffset + 3);

      objectOffset += 5;

      let obj;
      switch (objType) {
        case 0x3D:
          obj = {
            children: [],
          };
          const subObjCount = rawView.getUint16(objectOffset);
          for (let j = 0; j < subObjCount; j++) {
            obj.children.push(rawView.getUint16(objectOffset + 2 + (2 * j)));
          }
          obj.mystery1 = rawView.getFloat32(objectOffset + 2 + (2 * subObjCount));
          obj.mystery2 = rawView.getFloat32(objectOffset + 2 + (2 * subObjCount) + 4);
          obj.mystery3 = rawView.getFloat32(objectOffset + 2 + (2 * subObjCount) + 8);
          // TODO: More mysteries
          break;

        case 0x3A:
          obj = {
            mystery1: rawView.getUint8(objectOffset),
            faceIndex: rawView.getUint16(objectOffset + 1),
            faceCount: rawView.getUint16(objectOffset + 3),
            // TODO: More mysteries
          };
          break;

        case 0x3B:
          // TODO mp3 25/2
          obj = {};
          break;

        case 0x3E:
          // TODO
          obj = {};
          break;

        case 0x61:
          obj = {};
          // TODO
          break;

        case 0x5D:
          obj = {};
          // TODO mp3 13/0
          break;

        case 0x10: // TODO never seen this
          obj = {};
          // TODO
          break;

        default:
          throw `Unrecognized object type ${$$hex(objType)}`;
      }

      obj.objType = objType;

      result.objects[objIndex] = obj;

      objectOffset += objSize - 3; // -3 because +5 above included 3 from objSize
    }

    return result;
  }

  static parseCOL1(raw) {
    let rawView = new DataView(raw);
    let colors = [];
    let colorCount = rawView.getUint16(0);
    let colorOffset = 2;
    for (let i = 0; i < colorCount; i++) {
      colors.push(rawView.getUint32(colorOffset));
      colorOffset += 4;
    }
    return colors;
  }

  static parseVTX1(raw) {
    let rawView = new DataView(raw);
    let result = {
      vertices: [],
      scale: rawView.getFloat32(4),
    };
    let vertexCount = rawView.getUint16(0);
    let vertexOffset = 8;
    for (let i = 0; i < vertexCount; i++) {
      let vertex = {
        x: rawView.getInt16(vertexOffset),
        y: rawView.getInt16(vertexOffset + 2),
        z: rawView.getInt16(vertexOffset + 4),
        mystery1: rawView.getUint8(vertexOffset + 6),
        mystery2: rawView.getUint8(vertexOffset + 7),
        mystery3: rawView.getUint8(vertexOffset + 8),
      };
      result.vertices.push(vertex);

      vertexOffset += 9;
    }
    return result;
  }

  static parseFAC1(raw) {
    let rawView = new DataView(raw);
    let result = {
      faces: [],
    };
    let faceCount = rawView.getUint16(0);
    let faceOffset = 8;
    for (let i = 0; i < faceCount; i++) {
      let faceType = rawView.getUint8(faceOffset);

      if (faceType !== 0x35 && faceType !== 0x16 && faceType !== 0x30) // 0x30 in mainfs 9/81 mp1
        throw new Error(`Unrecognized faceType in FAC1: ${$$hex(faceType)}`);

      let face = {
        vtxEntries: [],
      };
      result.faces.push(face);

      faceOffset += 1; // Start after face_type

      if (faceType === 0x30) {
        faceOffset += 6; // TODO: What is 0x30 type? VTX num VTX?
      }
      else {
        const vtxEntryCount = faceType === 0x35 ? 4 : 3;
        for (let j = 0; j < vtxEntryCount; j++) {
          face.vtxEntries[j] = {
            vertexIndex: rawView.getUint16(faceOffset),
            mystery1: rawView.getUint16(faceOffset + 2),
            mystery2: rawView.getFloat32(faceOffset + 4),
            mystery3: rawView.getFloat32(faceOffset + 8),
          }
          faceOffset += 12; // sizeof(FAC1VtxEntry)
        }
      }

      face.mystery1 = rawView.getInt16(faceOffset);
      face.mystery2 = rawView.getInt16(faceOffset + 2);
      face.mystery3 = rawView.getUint8(faceOffset + 4); // 0x36

      // TODO 0x38 in mp2 31/5
      if (face.mystery3 !== 0x36 && face.mystery3 !== 0x37 && face.mystery3 !== 0x38 && face.mystery3 !== 0x30)
        throw new Error(`Unexpected mystery3 in FAC1 ${$$hex(face.mystery3)}`);

      faceOffset += 5;
    }
    return result;
  }

  static parsePAL1(raw) {
    let rawView = new DataView(raw);
    let result = {
      colors: [],
      bpp: 0,
    };
    let colorCount = rawView.getUint16(2);
    result.bpp = Math.floor((raw.byteLength - 4) / colorCount) * 8;
    let colorOffset = 4;
    for (let i = 0; i < colorCount; i++) {
      if (result.bpp === 32)
        result.colors.push(rawView.getUint32(colorOffset));
      else if (result.bpp === 16)
        result.colors.push(rawView.getUint16(colorOffset));
      else if (result.bpp === 8)
        result.colors.push(rawView.getUint8(colorOffset));
      else
        throw `FORM.parseType(PAL1): bpp: ${result.bpp}`;

      colorOffset += result.bpp / 8;
    }
    return result;
  }

  static parseSTRG(raw) {
    let rawView = new DataView(raw);
    let strings = [];
    let strCount = rawView.getUint16(0);
    let strOffset = 2 + strCount;
    for (let i = 0; i < strCount; i++) {
      let str = "";
      let strLen = rawView.getUint8(2 + i);
      for (let j = 0; j < strLen; j++) {
        str += String.fromCharCode(rawView.getUint8(strOffset + j));
      }
      strOffset += strLen;
      strings.push(str);
    }
    return strings;
  }

  static parseBMP(raw, palette) {
    let rawView = new DataView(raw);
    let width = rawView.getUint16(0x05);
    let height = rawView.getUint16(0x07);
    let inBmpSize = rawView.getUint16(0x0F);

    // Doesn't appear to indicate BPP, but we can calculate from size and dimens.
    let inBpp = 8 / ((width * height) / inBmpSize);
    let outBpp = palette.bpp;
    let inBmpData = new DataView(raw, 0x11, inBmpSize);
    return {
      width,
      height,
      src: PP64.utils.img.BMP.toRGBA(inBmpData, palette.colors, inBpp, outBpp)
    };
  }

  static replaceBMP(formObj, bmpIndex, buffer, palette) {
    // FIXME?: For now, this assumes that the new BMP has the same properties basically.
    // Also look at the huge blob at the bottom LOL get this thing done!

    // Just write over the bitmap data directly.
    PP64.utils.arrays.copyRange(formObj.BMP1[bmpIndex].raw, buffer, 0x11, 0, buffer.byteLength);

    // Update the parsed BMP just to keep the obj state consistent.
    //formObj.BMP1[bmpIndex].parsed = PP64.utils.FORM.parseBMP(buffer, palette);

    // Write the palette, which needs some care.
    formObj.PAL1[bmpIndex].parsed = palette;
    let oldNumThing = (new DataView(formObj.PAL1[bmpIndex].raw)).getUint16(0);
    let newRaw = formObj.PAL1[bmpIndex].raw = new ArrayBuffer(4 + (palette.colors.length * 4));
    let newPaletteView = new DataView(newRaw);
    newPaletteView.setUint16(0, oldNumThing); // Write the number that is mysterious
    newPaletteView.setUint16(2, palette.colors.length);
    let curOutOffset = 4;
    for (let i = 0; i < palette.colors.length; i++) {
      newPaletteView.setUint32(curOutOffset, palette.colors[i]);
      curOutOffset += 4;
    }
  }
};
