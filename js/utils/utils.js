PP64.ns("utils");

PP64.utils.arrays = {
  copyRange: function copyRange(outArr, inArr, outOffset, inOffset, len) {
    if (outArr instanceof ArrayBuffer)
      outArr = new DataView(outArr);
    if (inArr instanceof ArrayBuffer)
      inArr = new DataView(inArr);

    for (var i = 0; i < len; i++) {
      outArr.setUint8(outOffset + i, inArr.getUint8(inOffset + i));
    }
  },

  arrayToArrayBuffer: function arrayToArrayBuffer(arr) {
    let buffer = new ArrayBuffer(arr.length);
    let u8arr = new Uint8Array(buffer);
    for (let i = 0; i < arr.length; i++) {
      u8arr[i] = arr[i];
    }
    return buffer;
  },

  hash: function hashArrayBuffer(arr, startOffset, len) {
    // Can't be equal if our length would extend out of bounds.
    if (startOffset + len > arr.byteLength)
      return "";
    return SparkMD5.ArrayBuffer.hash(arr, { start: startOffset, length: len });
  },

  hashEqual: function (hashArgs, expected) {
    return PP64.utils.arrays.hash.apply(this, hashArgs).toLowerCase() === expected.toLowerCase();
  },

  toHexString: function toHexString(buffer, len = buffer.byteLength, lineLen = 0) {
    let output = "";
    let view = buffer;
    if (buffer instanceof ArrayBuffer)
      view = new DataView(buffer);
    for (var i = 0; i < len; i++) {
      output += $$hex(view.getUint8(i), "") + ((i && lineLen && ((i + 1) % lineLen === 0)) ? "\n" : " ");
    }
    return output;
  },

  print: function printArrayBuffer(buffer, len = buffer.byteLength, lineLen = 0) {
    console.log(PP64.utils.arrays.toHexString(buffer, len, lineLen));
  },

  readBitAtOffset: function readBitAtOffset(buffer, bitOffset) {
    let bufView = buffer;
    if (bufView instanceof ArrayBuffer)
      bufView = new DataView(buffer);
    let byteOffset = Math.floor(bitOffset / 8);
    let inByteOffset = bitOffset % 8;
    let mask = 0x80 >>> inByteOffset;
    let maskedBit = bufView.getUint8(byteOffset) & mask;
    return maskedBit ? 1 : 0;
  },

  readByteAtBitOffset: function readByteAtBitOffset(buffer, bitOffset) {
    let bufView = buffer;
    if (bufView instanceof ArrayBuffer)
      bufView = new DataView(buffer);
    let shortOffset = Math.floor(bitOffset / 8);
    let inShortOffset = bitOffset % 8;
    let mask = 0xFF00 >>> inShortOffset;
    let maskedByte = bufView.getUint16(shortOffset) & mask;
    return maskedByte >>> (8 - inShortOffset);
  },

  arrayBufferToImageData: function arrayBufferToImageData(buffer, width, height) {
    let canvasCtx = PP64.utils.canvas.createContext(width, height);
    let bgImageData = canvasCtx.createImageData(width, height);
    let bufView = new Uint8Array(buffer);

    for (let i = 0; i < buffer.byteLength; i++) {
      bgImageData.data[i] = bufView[i];
    }

    return bgImageData;
  },

  arrayBufferToDataURL: function arrayBufferToDataURL(buffer, width, height) {
    let bgImageData = PP64.utils.arrays.arrayBufferToImageData(buffer, width, height)
    let canvasCtx = PP64.utils.canvas.createContext(width, height);
    canvasCtx.putImageData(bgImageData, 0, 0);
    return canvasCtx.canvas.toDataURL();
  },

  arrayBuffersEqual: function arrayBuffersEqual(first, second) {
    if (first.byteLength !== second.byteLength)
      return false;
    let firstArr = new Uint8Array(first);
    let secondArr = new Uint8Array(second);
    for (let i = 0; i < firstArr.byteLength; i++) {
      if (firstArr[i] !== secondArr[i])
        return false;
    }
    return true;
  },

  // Joins two ArrayBuffers
  join: function join(buffer1, buffer2) {
    if (!buffer1 || !buffer2) {
      return buffer1 || buffer2;
    }

    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
  },

  equal: function ArraysEqual(a, b) {
    if (a === b)
      return true;
    if (a.length !== b.length)
      return false;

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i])
        return false;
    }
    return true;
  },

  /**
   * Creates the intersection of two arrays.
   * equalityFn takes two values and decides if they're equal.
   */
  intersection: function ArrayIntersection(a, b, equalityFn = (a, b) => a === b) {
    const output = [];

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      for (let j = 0; j < b.length; j++) {
        if (equalityFn(aVal, b[j])) {
          output.push(aVal);
          break;
        }
      }
    }

    return output;
  },
};

PP64.ns("utils.img");

// Cuts an image from a bigger image at x,y coordinates.
// A mystery: why didn't I use canvas?
PP64.utils.img.cutFromWhole = function cutFromWhole(srcBuffer, srcWidth, srcHeight, bpp, x, y, width, height) {
  let pieceWidth = width * (bpp / 8);
  let outBuffer = new ArrayBuffer(pieceWidth * height);
  let outArr = new Uint8Array(outBuffer);
  let inArr = new Uint8Array(srcBuffer);

  let srcByteWidth = (srcWidth * (bpp / 8));
  let pieceXStart = (x * (bpp / 8));
  let outPos = 0;
  for (let yi = y; yi < (y + height); yi++) {
    let rowIdx = pieceXStart + (srcByteWidth * yi);
    for (let j = 0; j < pieceWidth; j++) {
      outArr[outPos++] = inArr[rowIdx + j]
    }
  }
  return outBuffer;
};

PP64.utils.img.toArrayBuffer = function toArrayBuffer(image, width, height) {
  let canvasCtx = PP64.utils.canvas.createContext(width, height);
  canvasCtx.drawImage(image, 0, 0, width, height);
  return canvasCtx.getImageData(0, 0, width, height).data.buffer;
};

PP64.utils.img.invertColor = function invertColor(hex) {
  const rOrig = (hex >>> 16) & 0xFF;
  const gOrig = (hex >>> 8) & 0xFF;
  const bOrig = hex & 0xFF;

  const r = (255 - rOrig);
  const g = (255 - gOrig);
  const b = (255 - bOrig);

  return (r << 16 | g << 8 | b);
}

PP64.utils.browser = {
  updateWindowTitle: function updateWindowTitle(boardName) {
    boardName = boardName || PP64.boards.getCurrentBoard().name;
    boardName = PP64.utils.string.mpFormatToPlainText(boardName);
    document.title = boardName ?  `PartyPlanner64 - ${boardName}` : "PartyPlanner64";
  }
};

PP64.utils.drag = {
  showDragZone: function showDragZone() {
    var dragZone = document.getElementById("dragZone");
    document.getElementById("dragZone").style.display = "inline-block";
    if (!dragZone.ondragover) {
      dragZone.ondragover = event => {
        event.preventDefault(); // DragZone supports equality.
      };
    }
    if (!dragZone.ondragenter) {
      dragZone.ondragenter = event => {
        dragZone.className = "hover";
      };
    }
    if (!dragZone.ondragleave) {
      dragZone.ondragleave = event => {
        dragZone.className = "";
      };
    }
  },
  hideDragZone: function hideDragZone() {
    let dragZone = document.getElementById("dragZone");
    dragZone.style.display = "none";
    dragZone.className = "";
    PP64.utils.drag.clearHandlers();
  },
  setDropHandler: function setDropHandler(fn) {
    document.getElementById("dragZone").ondrop = fn;
  },
  clearHandlers: function clearHandlers() {
    document.getElementById("dragZone").ondrop = null;
  }
};

PP64.utils.input = {
  openFile: function openFile(acceptTypes = "", callback) {
    // Cache a set of <input> elements, one for each accept type so the last
    // accessed directory hopefully remains consistent between filetypes.
    let inputs = PP64.utils.input._inputs;
    if (!inputs)
      inputs = PP64.utils.input._inputs = {};

    let typeKey = acceptTypes || "default";
    let inputEl = inputs[typeKey];
    if (!inputEl) {
      inputEl = inputs[typeKey] = document.createElement("input");
      inputEl.type = "file";
    }
    inputEl.accept = acceptTypes;

    let closuredCallback = event => {
      callback(event);
      inputEl.removeEventListener("change", closuredCallback);

      // Chrome won't fire the change event for the same file twice unless value is cleared.
      inputEl.value = null;
    };

    inputEl.addEventListener("change", closuredCallback);
    inputEl.click();
  }
};

PP64.utils.obj = {
  copy: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  equals: function(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }
};

PP64.utils.string = {
  fromU32: function(u32) {
    return String.fromCharCode((u32 & 0xFF000000) >>> 24) +
      String.fromCharCode((u32 & 0xFF0000) >>> 16) +
      String.fromCharCode((u32 & 0xFF00) >>> 8) +
      String.fromCharCode(u32 & 0xFF);
  },
  toU32: function(str) {
    let charCodes = PP64.utils.string.toCharCodes(str);
    let u32 = 0;
    u32 |= charCodes[0] << 24;
    u32 |= charCodes[1] << 16;
    u32 |= charCodes[2] << 8;
    u32 |= charCodes[3];
    return u32;
  },
  toCharCodes: function(str) {
    let charCodes = new Array(str.length);
    for (let i = 0; i < str.length; ++i)
      charCodes[i] = str.charCodeAt(i);
    return charCodes;
  },
  splice: function(value, start, delCount, newSubStr) {
    return value.slice(0, start) + newSubStr + value.slice(start + Math.abs(delCount));
  },
  normalizeLineEndings: function(str) {
    if (!str)
      return str;
    return str.replace(/\r\n|\r/g, "\n");
  },
  mpFormatToPlainText: function(value) {
    if (!value)
      return "";
    return value.replace(/<\w+>/g, "") // Remove color tags
      .replace("\u3000", "Ⓐ")  // ! A button
      .replace("\u3001", "Ⓑ")  // " B button
      .replace("\u3002", "▲") //  C-up button
      .replace("\u3003", "►") //  C-right button
      .replace("\u3004", "◄") //  C-left button
      .replace("\u3005", "▼") // & C-down button
      .replace("\u3006", "Ⓩ")  // ' Z button
      .replace("\u3007", "🕹️")    // ( Analog stick
      .replace("\u3008", "✪")  // ) (coin)
      .replace("\u3009", "★")    // * Star
      .replace("\u3010", "Ⓢ")  // , S button
      .replace("\u3011", "Ⓡ") // , R button
  },
};

var $$number = PP64.utils.number = {
  distance: function(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  },

  midpoint: function(x1, y1, x2, y2) {
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2
    };
  },

  // Distance from tx,ty to the line made from x1,y1 --- x2,y2
  lineDistance: function(tx, ty, x1, y1, x2, y2) {
    return Math.abs(((y2 - y1)*tx) - ((x2 - x1)*ty) + (x2 * y1) - (y2 * x1)) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
  },

  makeDivisibleBy: function(num, by) {
    return by * Math.ceil(num / by);
  },

  degreesToRadians: function(degrees) {
    return degrees * Math.PI / 180;
  },

  radiansToDegrees: function(radians) {
    return radians * 180 / Math.PI;
  },
};

PP64.utils.debug = {
  log: function() {
    if ($$debug)
      console.log.apply(console, arguments);
  },
  hex: function(num, prefix = "0x") {
    let hexVal = Number(Math.abs(num)).toString(16).toUpperCase();
    if (hexVal.length === 1)
      hexVal = "0" + hexVal;
    return (num < 0 ? "-" : "") + prefix + hexVal;
  }
};

PP64.utils.canvas = {
  createContext: function createContext(width, height) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext("2d");
  }
};

PP64.utils.react = {
  makeKeyClick: function(fn, ctx) {
    if (ctx)
      fn = fn.bind(ctx);
    return (event) => {
      if (event.keyCode === 13 || event.keyCode === 32) {
        fn(event);
        event.stopPropagation();
        event.preventDefault();
      }
    };
  }
};

PP64.utils.analytics = {
  recordEvent: function(eventName, params) {
    try {
      if (window.gtag) {
        gtag("event", eventName, params);
      }
    }
    catch (e) {
      console.error(e); // But don't crash for analytics.
    }
  }
};

var $$log = PP64.utils.debug.log;
var $$hex = PP64.utils.debug.hex;
