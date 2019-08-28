const ENTER_KEYCODE = 13;
const SPACE_KEYCODE = 32;

interface IKeyClickOpts {
  enter?: boolean;
  space?: boolean;
}

interface IKeyEventHandler {
  (event: KeyboardEvent | React.KeyboardEvent): void;
}

export function makeKeyClick(fn: IKeyEventHandler, opts?: IKeyClickOpts) {
  return (event: KeyboardEvent | React.KeyboardEvent) => {
    function finish() {
      fn(event);
      event.stopPropagation();
      event.preventDefault();
    }

    if ((!opts || opts.enter) && event.keyCode === ENTER_KEYCODE) {
      finish();
    }
    else if ((!opts || opts.space) && event.keyCode === SPACE_KEYCODE) {
      finish();
    }
  };
}
