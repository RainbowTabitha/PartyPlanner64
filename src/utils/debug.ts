import { isDebug } from "../debug";

export function $$log(...args: any[]) {
  if (isDebug())
    console.log.apply(console, arguments as any);
}

export function $$hex(num: number, prefix: string = "0x") {
  let hexVal = Number(Math.abs(num)).toString(16).toUpperCase();
  if (hexVal.length === 1)
    hexVal = "0" + hexVal;
  return (num < 0 ? "-" : "") + prefix + hexVal;
}

/** Does an assertion. */
export function assert(condition: boolean) {
  if (isDebug()) {
    if (!condition) {
      debugger;
      throw new Error("Assertion failed");
    }
  }
}
