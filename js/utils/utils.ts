namespace PP64.utils {
  export class arrays {
    public static copyRange(outArr: ArrayBuffer | DataView, inArr: ArrayBuffer | DataView, outOffset: number, inOffset: number, len: number) {
      if (outArr instanceof ArrayBuffer)
        outArr = new DataView(outArr);
      if (inArr instanceof ArrayBuffer)
        inArr = new DataView(inArr);

      for (var i = 0; i < len; i++) {
        outArr.setUint8(outOffset + i, inArr.getUint8(inOffset + i));
      }
    }

    public static arrayToArrayBuffer(arr: number[]) {
      let buffer = new ArrayBuffer(arr.length);
      let u8arr = new Uint8Array(buffer);
      for (let i = 0; i < arr.length; i++) {
        u8arr[i] = arr[i];
      }
      return buffer;
    }

    public static hash(arr: any, startOffset: number, len: number) {
      // Can't be equal if our length would extend out of bounds.
      if (startOffset + len > arr.byteLength)
        return "";
      return (window as any).SparkMD5.ArrayBuffer.hash(arr, { start: startOffset, length: len });
    }

    public static hashEqual(hashArgs: any, expected: string) {
      return PP64.utils.arrays.hash.apply(this, hashArgs).toLowerCase() === expected.toLowerCase();
    }

    public static toHexString(buffer: ArrayBuffer | DataView, len: number = buffer.byteLength, lineLen: number = 0) {
      let output = "";
      let view: DataView;
      if (buffer instanceof ArrayBuffer)
        view = new DataView(buffer);
      else
        view = buffer;
      for (var i = 0; i < len; i++) {
        output += $$hex(view.getUint8(i), "") + ((i && lineLen && ((i + 1) % lineLen === 0)) ? "\n" : " ");
      }
      return output;
    }

    public static print(buffer: ArrayBuffer | DataView, len = buffer.byteLength, lineLen = 0) {
      console.log(PP64.utils.arrays.toHexString(buffer, len, lineLen));
    }

    public static readBitAtOffset(buffer: ArrayBuffer | DataView, bitOffset: number) {
      let bufView = buffer;
      if (bufView instanceof ArrayBuffer)
        bufView = new DataView(bufView);
      let byteOffset = Math.floor(bitOffset / 8);
      let inByteOffset = bitOffset % 8;
      let mask = 0x80 >>> inByteOffset;
      let maskedBit = bufView.getUint8(byteOffset) & mask;
      return maskedBit ? 1 : 0;
    }

    public static readByteAtBitOffset(buffer: ArrayBuffer | DataView, bitOffset: number) {
      let bufView = buffer;
      if (bufView instanceof ArrayBuffer)
        bufView = new DataView(bufView);
      let shortOffset = Math.floor(bitOffset / 8);
      let inShortOffset = bitOffset % 8;
      let mask = 0xFF00 >>> inShortOffset;
      let maskedByte = bufView.getUint16(shortOffset) & mask;
      return maskedByte >>> (8 - inShortOffset);
    }

    public static arrayBufferToImageData(buffer: ArrayBuffer, width: number, height: number) {
      let canvasCtx = PP64.utils.canvas.createContext(width, height);
      let bgImageData = canvasCtx.createImageData(width, height);
      let bufView = new Uint8Array(buffer);

      for (let i = 0; i < buffer.byteLength; i++) {
        bgImageData.data[i] = bufView[i];
      }

      return bgImageData;
    }

    public static arrayBufferToDataURL(buffer: ArrayBuffer, width: number, height: number) {
      let bgImageData = PP64.utils.arrays.arrayBufferToImageData(buffer, width, height)
      let canvasCtx = PP64.utils.canvas.createContext(width, height);
      canvasCtx.putImageData(bgImageData, 0, 0);
      return canvasCtx.canvas.toDataURL();
    }

    public static arrayBuffersEqual(first: ArrayBuffer, second: ArrayBuffer) {
      if (first.byteLength !== second.byteLength)
        return false;
      let firstArr = new Uint8Array(first);
      let secondArr = new Uint8Array(second);
      for (let i = 0; i < firstArr.byteLength; i++) {
        if (firstArr[i] !== secondArr[i])
          return false;
      }
      return true;
    }

    // Joins two ArrayBuffers
    public static join(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer {
      if (!buffer1 || !buffer2) {
        return buffer1 || buffer2;
      }

      const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
      tmp.set(new Uint8Array(buffer1), 0);
      tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
      return tmp.buffer as ArrayBuffer;
    }

    /**
     * Tests if two arrays are equal.
     * They are equal if:
     *   - They are the same reference.
     *   - They have the same number of items
     *   - Each item is === across arrays.
     */
    public static equal(a: any[], b: any[]) {
      if (a === b)
        return true;
      if (a.length !== b.length)
        return false;

      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
          return false;
      }
      return true;
    }

    /**
     * Creates the intersection of two arrays.
     * equalityFn takes two values and decides if they're equal.
     */
    public static intersection(a: any[], b: any[], equalityFn = (a: any, b: any) => a === b) {
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
    }
  }

  export class browser {
    public static updateWindowTitle(boardName: string) {
      boardName = boardName || PP64.boards.getCurrentBoard().name;
      boardName = PP64.utils.string.mpFormatToPlainText(boardName);
      document.title = boardName ?  `PartyPlanner64 - ${boardName}` : "PartyPlanner64";
    }
  }

  export class drag {
    public static showDragZone() {
      var dragZone = document.getElementById("dragZone")!;
      dragZone.style.display = "inline-block";
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
    }

    public static hideDragZone() {
      let dragZone = document.getElementById("dragZone")!;
      dragZone.style.display = "none";
      dragZone.className = "";
      PP64.utils.drag.clearHandlers();
    }
    public static setDropHandler(fn: any) {
      document.getElementById("dragZone")!.ondrop = fn;
    }
    public static clearHandlers() {
      document.getElementById("dragZone")!.ondrop = null;
    }

    private static __eventParamDropHandler: Function | null;

    public static setEventParamDropHandler(fn: Function | null) {
      PP64.utils.drag.__eventParamDropHandler = fn;
    }
    public static getEventParamDropHandler() {
      return PP64.utils.drag.__eventParamDropHandler;
    }
  }

  export class input {
    private static _inputs: { [acceptTypes: string]: HTMLInputElement };

    public static openFile(acceptTypes: string = "", callback: (event: Event) => void) {
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

      let closuredCallback = (event: Event) => {
        callback(event);
        inputEl.removeEventListener("change", closuredCallback);

        // Chrome won't fire the change event for the same file twice unless value is cleared.
        (inputEl as any).value = null;
      };

      inputEl.addEventListener("change", closuredCallback);
      inputEl.click();
    }
  }

  export class obj {
    public static copy(obj: any) {
      return JSON.parse(JSON.stringify(obj));
    }

    public static equals(obj1: any, obj2: any) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
  }

  class stringclass {
    public static fromU32(u32: number) {
      return String.fromCharCode((u32 & 0xFF000000) >>> 24) +
        String.fromCharCode((u32 & 0xFF0000) >>> 16) +
        String.fromCharCode((u32 & 0xFF00) >>> 8) +
        String.fromCharCode(u32 & 0xFF);
    }
    public static toU32(str: string) {
      let charCodes = PP64.utils.string.toCharCodes(str);
      let u32 = 0;
      u32 |= charCodes[0] << 24;
      u32 |= charCodes[1] << 16;
      u32 |= charCodes[2] << 8;
      u32 |= charCodes[3];
      return u32;
    }
    public static toCharCodes(str: string) {
      let charCodes = new Array(str.length);
      for (let i = 0; i < str.length; ++i)
        charCodes[i] = str.charCodeAt(i);
      return charCodes;
    }
    public static pad(str: string, len: number, padChar: string) {
      while (str.length < len) {
        str = padChar + str;
      }
      return str;
    }
    public static splice(value: string, start: number, delCount: number, newSubStr: string) {
      return value.slice(0, start) + newSubStr + value.slice(start + Math.abs(delCount));
    }
    public static normalizeLineEndings(str: string) {
      if (!str)
        return str;
      return str.replace(/\r\n|\r/g, "\n");
    }
    public static mpFormatToPlainText(value: string) {
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
    }
  }
  export const string = stringclass;

  class numberclass {
    public static distance(x1: number, y1: number, x2: number, y2: number) {
      return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }

    public static midpoint(x1: number, y1: number, x2: number, y2: number) {
      return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2
      };
    }

    // Distance from tx,ty to the line made from x1,y1 --- x2,y2
    public static lineDistance(tx: number, ty: number, x1: number, y1: number, x2: number, y2: number) {
      return Math.abs(((y2 - y1)*tx) - ((x2 - x1)*ty) + (x2 * y1) - (y2 * x1)) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
    }

    /**
     * Tests if (x,y) falls within the square formed from (x_s,y_s) - (x_f,y_f)
     * Being exactly at (x_s,y_s) or (x_f,y_f) is considered in.
     */
    public static pointFallsWithin(x: number, y: number, xs: number, ys: number, xf: number, yf: number) {
      const [minX, maxX] = [Math.min(xs, xf), Math.max(xs, xf)];
      const [minY, maxY] = [Math.min(ys, yf), Math.max(ys, yf)];
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    public static makeDivisibleBy(num: number, by: number) {
      return by * Math.ceil(num / by);
    }

    public static degreesToRadians(degrees: number) {
      return degrees * Math.PI / 180;
    }

    public static radiansToDegrees(radians: number) {
      return radians * 180 / Math.PI;
    }

    /**
     * Determines the angle made by two points.
     * @returns Radians counter-clockwise from the +x axis.
     */
    public static determineAngle(xOrigin: number, yOrigin: number, x: number, y: number) {
      const deltaX = x - xOrigin;
      const deltaY = y - yOrigin;
      let angleRadians = Math.atan2(deltaY, deltaX);
      if (angleRadians < 0) {
        return Math.abs(angleRadians);
      }
      return Math.abs(angleRadians - Math.PI) + Math.PI;
    }

    /**
     * Gets the IEEE-754 float formatted version of a number.
     * For example, 1.0 yields 0x3f800000
     */
    public static getRawFloat32Format(num: number) {
      const buffer = new ArrayBuffer(4);
      const dataView = new DataView(buffer);
      dataView.setFloat32(0, num);
      return dataView.getUint32(0);
    }
  }
  export const number = numberclass;

  export class debug {
    public static log(...args: any[]) {
      if ($$debug)
        console.log.apply(console, arguments);
    }

    public static hex(num: number, prefix: string = "0x") {
      let hexVal = Number(Math.abs(num)).toString(16).toUpperCase();
      if (hexVal.length === 1)
        hexVal = "0" + hexVal;
      return (num < 0 ? "-" : "") + prefix + hexVal;
    }
  }

  export class canvas {
    public static createContext(width: number, height: number): CanvasRenderingContext2D {
      let canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas.getContext("2d")!;
    }
  }

  export class react {
    public static makeKeyClick(fn: any, ctx: any) {
      if (ctx)
        fn = fn.bind(ctx);
      return (event: KeyboardEvent | React.KeyboardEvent) => {
        if (event.keyCode === 13 || event.keyCode === 32) {
          fn(event);
          event.stopPropagation();
          event.preventDefault();
        }
      };
    }
  }

  export class analytics {
    public static recordEvent(eventName: string, params: any) {
      try {
        if ((window as any).gtag) {
          (window as any).gtag("event", eventName, params);
        }
      }
      catch (e) {
        console.error(e); // But don't crash for analytics.
      }
    }
  }
}

namespace PP64.utils.img {
  // Cuts an image from a bigger image at x,y coordinates.
  // A mystery: why didn't I use canvas?
  export function cutFromWhole(srcBuffer: ArrayBuffer, srcWidth: number, srcHeight: number, bpp: number, x: number, y: number, width: number, height: number) {
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

  export function toArrayBuffer(image: HTMLImageElement, width: number, height: number) {
    let canvasCtx = PP64.utils.canvas.createContext(width, height);
    canvasCtx.drawImage(image, 0, 0, width, height);
    return canvasCtx.getImageData(0, 0, width, height).data.buffer;
  };

  export function invertColor(hex: number) {
    const rOrig = (hex >>> 16) & 0xFF;
    const gOrig = (hex >>> 8) & 0xFF;
    const bOrig = hex & 0xFF;

    const r = (255 - rOrig);
    const g = (255 - gOrig);
    const b = (255 - bOrig);

    return (r << 16 | g << 8 | b);
  };
}

var $$number = PP64.utils.number;
var $$log = PP64.utils.debug.log;
var $$hex = PP64.utils.debug.hex;

var isElectron: boolean = (function() {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.indexOf(' electron/') > -1;
})();
