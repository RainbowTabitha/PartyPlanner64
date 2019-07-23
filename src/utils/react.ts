export function makeKeyClick(fn: any, ctx: any) {
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
