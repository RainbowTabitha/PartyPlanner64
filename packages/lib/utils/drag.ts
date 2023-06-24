export function showDragZone() {
  const dragZone = document.getElementById("dragZone")!;
  dragZone.style.display = "inline-block";
  if (!dragZone.ondragover) {
    dragZone.ondragover = (event) => {
      event.preventDefault(); // DragZone supports equality.
    };
  }
  if (!dragZone.ondragenter) {
    dragZone.ondragenter = (event) => {
      dragZone.className = "hover";
    };
  }
  if (!dragZone.ondragleave) {
    dragZone.ondragleave = (event) => {
      dragZone.className = "";
    };
  }
}

export function hideDragZone() {
  const dragZone = document.getElementById("dragZone")!;
  dragZone.style.display = "none";
  dragZone.className = "";
  clearHandlers();
}
export function setDropHandler(fn: any) {
  document.getElementById("dragZone")!.ondrop = fn;
}
export function clearHandlers() {
  document.getElementById("dragZone")!.ondrop = null;
}

let __eventParamDropHandler: Function | null;

export function setEventParamDropHandler(fn: Function | null) {
  __eventParamDropHandler = fn;
}
export function getEventParamDropHandler() {
  return __eventParamDropHandler;
}
