export function $$log(...args: any[]) {
  if ($$debug)
    console.log.apply(console, arguments);
}

export function $$hex(num: number, prefix: string = "0x") {
  let hexVal = Number(Math.abs(num)).toString(16).toUpperCase();
  if (hexVal.length === 1)
    hexVal = "0" + hexVal;
  return (num < 0 ? "-" : "") + prefix + hexVal;
}
