let _inputs: { [acceptTypes: string]: HTMLInputElement };

export function openFile(acceptTypes: string = "", callback: (event: Event) => void) {
  // Cache a set of <input> elements, one for each accept type so the last
  // accessed directory hopefully remains consistent between filetypes.
  let inputs = _inputs;
  if (!inputs)
    inputs = _inputs = {};

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
