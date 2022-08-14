import * as React from "react";
import * as ReactDOM from "react-dom";

import "./css/toolwindow.scss";

export interface IToolWindowProps {
  name: string;
  position?: string;
  visible?: boolean;
  canClose?: boolean;
  children?: React.ReactNode;
  onCloseClick?: () => void;
}

export interface IToolWindowState {
  left: number;
  top: number;
  manuallyPlaced: boolean;
}

export class ToolWindow extends React.Component<IToolWindowProps, IToolWindowState> {
  state = {
    left: -1000,
    top: -1000,
    manuallyPlaced: false,
  }

  render() {
    if (!this.props.visible)
      return null;

    const style = {
      left: this.state.left,
      top: this.state.top,
    };
    return (
      <div className="toolWindow" style={style}>
        <div className="toolWindowName" onMouseDown={this.mouseDown}>
          {this.props.name}
          {this.props.canClose &&
            <div className="toolWindowCloseBtn" aria-label="Close"
              onClick={this.props.onCloseClick}>×</div>}
        </div>
        {this.props.children}
      </div>
    );
  }

  componentDidMount() {
    if (this.props.visible)
      this.updatePositionState();

    window.addEventListener("resize", this.onWindowResize);

    this.attachMutationObserver();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize);

    this.detachMutationObserver()
  }

  componentDidUpdate() {
    if (this.props.visible)
      this.updatePositionState();

    this.detachMutationObserver(); // It probably got destroyed anyway.
    this.attachMutationObserver();
  }

  shouldComponentUpdate(nextProps: IToolWindowProps, nextState: IToolWindowState) {
    return !this.tryUpdatePosition(nextState);
  }

  attachMutationObserver() {
    const container = ReactDOM.findDOMNode(this);
    if (container && "MutationObserver" in window) {
      const observer = new MutationObserver((mutations: MutationRecord[]) => {
        this.updatePositionState();
      });
      const observerConfig = { childList: true, subtree: true };
      observer.observe(container, observerConfig);

      _mutationObservers[this.props.name] = observer;
    }
  }

  detachMutationObserver() {
    if (_mutationObservers[this.props.name]) {
      _mutationObservers[this.props.name].disconnect();
      delete _mutationObservers[this.props.name];
    }
  }

  tryUpdatePosition(newState: IToolWindowState) {
    const changed = this.state.left !== newState.left || this.state.top !== newState.top;
    if (changed)
      this.updatePosition(newState);
    return changed;
  }

  updatePosition(state: IToolWindowState) {
    state = state || this.state;
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    if (el) {
      el.style.left = state.left + "px";
      el.style.top = state.top + "px";
    }
  }

  tryUpdatePositionState(newState: any) {
    const changed = this.state.left !== newState.left || this.state.top !== newState.top;
    if (changed)
      this.setState(newState);
    return changed;
  }

  updatePositionState() {
    if (!this.state.manuallyPlaced) {
      // Do the default positioning based on the prop setting.
      const newPos: { left?: number, top?: number } = {};
      const pos = this.props.position!;
      if (pos.indexOf("Left") !== -1)
        newPos.left = 0;
      if (pos.indexOf("Right") !== -1)
        newPos.left = this.getContainerWidth() - this.getWidth();
      if (pos.indexOf("Top") !== -1)
        newPos.top = 0;
      if (pos.indexOf("Bottom") !== -1)
        newPos.top = this.getContainerHeight() - this.getHeight();
      this.tryUpdatePositionState(newPos);
    }
    else {
      // Make sure we haven't gone out of bounds.
      const newPos = _keepInBounds(this, { left: this.state.left, top: this.state.top });
      this.tryUpdatePositionState(newPos);
    }
  }

  getWidth() {
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    return (el && el.offsetWidth) || 0;
  }

  getHeight() {
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    return (el && el.offsetHeight) || 0;
  }

  getContainerWidth() {
    const el = document.getElementsByClassName("main")[0] as HTMLElement;//this.getContainerEl();
    return (el && el.offsetWidth) || 0;
  }

  getContainerHeight() {
    const el = document.getElementsByClassName("main")[0] as HTMLElement; //this.getContainerEl();
    return (el && el.offsetHeight) || 0;
  }

  getContainerEl() {
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    return (el && (el.offsetParent as HTMLElement)) || null;
  }

  mouseDown = (event: React.MouseEvent) => {
    //console.log("ToolWindow.mousedown", event, event.clientX, event.clientY);
    _movingToolWindow = this;
    [_lastX, _lastY] = [event.clientX, event.clientY];

    const movetarget = this.getContainerEl();
    movetarget.addEventListener("mousemove", _mousemove);
    movetarget.addEventListener("mouseup", _mouseend);
    movetarget.addEventListener("mouseleave", _mouseend);

    movetarget.classList.add("moving");
  }

  onWindowResize = () => {
    this.updatePositionState();
  }
};

let _lastX: number | null = null;
let _lastY: number | null = null;
let _movingToolWindow: ToolWindow | null = null;
const _mutationObservers: { [name: string]: MutationObserver} = {};

function _mousemove(event: MouseEvent) {
  //console.log("ToolWindow.mousemove", event);
  const [curX, curY] = [event.clientX, event.clientY];
  const [diffX, diffY] = [curX - _lastX!, curY - _lastY!];
  //console.log("ToolWindow.mousemove", "diffX", diffX, "diffY", diffY);
  let newState: IToolWindowState = {
    left: _movingToolWindow!.state.left + diffX,
    top: _movingToolWindow!.state.top + diffY,
    manuallyPlaced: true,
  };
  newState = _keepInBounds(_movingToolWindow!, newState);
  _movingToolWindow!.setState(newState);

  [_lastX, _lastY] = [curX, curY];
}

function _mouseend(event: MouseEvent) {
  //console.log("ToolWindow.mouseup", event);
  const movetarget = _movingToolWindow!.getContainerEl();

  if (event.type === "mouseleave" && event.target !== movetarget)
    return;

  movetarget.removeEventListener("mousemove", _mousemove);
  movetarget.removeEventListener("mouseup", _mouseend);
  movetarget.removeEventListener("mouseleave", _mouseend);

  movetarget.classList.remove("moving");

  _movingToolWindow = null;
  _lastX = _lastY = null;
}

function _keepInBounds(toolwindow: ToolWindow, newState: Partial<IToolWindowState>): IToolWindowState {
  if (newState.left! < 0)
    newState.left = 0;
  else {
    const maxLeft = toolwindow.getContainerWidth() - toolwindow.getWidth();
    if (newState.left! > maxLeft)
      newState.left = maxLeft;
  }
  if (newState.top! < 0)
    newState.top = 0;
  else {
    const maxTop = toolwindow.getContainerHeight() - toolwindow.getHeight();
    if (newState.top! > maxTop)
      newState.top = maxTop;
  }
  return newState as IToolWindowState;
}
