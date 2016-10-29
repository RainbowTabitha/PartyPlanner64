PP64.toolwindow = (function() {
  const ToolWindow = class ToolWindow extends React.Component {
    state = {
      left: -1000,
      top: -1000,
      manuallyPlaced: false,
    }

    render() {
      if (!this.props.visible)
        return null;

      let style = {
        left: this.state.left,
        top: this.state.top,
      };
      return (
        <div className="toolWindow" style={style}>
          <div className="toolWindowName" onMouseDown={this.mouseDown}>{this.props.name}</div>
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

    shouldComponentUpdate(nextProps, nextState, nextContext) {
      return !this.tryUpdatePosition(nextState);
    }

    attachMutationObserver() {
      let container = ReactDOM.findDOMNode(this);
      if (container && window.MutationObserver) {
        let observer = new MutationObserver(function(mutations) {
          this.updatePositionState();
        }.bind(this));
        let observerConfig = { childList: true, subtree: true };
        observer.observe(container, observerConfig);

        _mutationObservers[this.props.name] = observer;
      }
    }

    detachMutationObserver() {
      if (_mutationObservers[this.props.name]) {
        _mutationObservers[this.props.name].disconnect();
        _mutationObservers[this.props.name] = null;
      }
    }

    tryUpdatePosition(newState) {
      let changed = this.state.left !== newState.left || this.state.top !== newState.top;
      if (changed)
        this.updatePosition(newState);
      return changed;
    }

    updatePosition(state) {
      state = state || this.state;
      let el = ReactDOM.findDOMNode(this);
      if (el) {
        el.style.left = state.left + "px";
        el.style.top = state.top + "px";
      }
    }

    tryUpdatePositionState(newState) {
      let changed = this.state.left !== newState.left || this.state.top !== newState.top;
      if (changed)
        this.setState(newState);
      return changed;
    }

    updatePositionState() {
      if (!this.state.manuallyPlaced) {
        // Do the default positioning based on the prop setting.
        let newPos = {};
        let pos = this.props.position;
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
        let newPos = _keepInBounds(this, { left: this.state.left, top: this.state.top });
        this.tryUpdatePositionState(newPos);
      }
    }

    getWidth() {
      let el = ReactDOM.findDOMNode(this);
      return el && el.offsetWidth || 0;
    }

    getHeight() {
      let el = ReactDOM.findDOMNode(this);
      return el && el.offsetHeight || 0;
    }

    getContainerWidth() {
      let el = this.getContainerEl();
      return el && el.offsetWidth || 0;
    }

    getContainerHeight() {
      let el = this.getContainerEl();
      return el && el.offsetHeight || 0;
    }

    getContainerEl() {
      let el = ReactDOM.findDOMNode(this);
      return el && el.offsetParent || null;
    }

    mouseDown = (event) => {
      //console.log("ToolWindow.mousedown", event, event.clientX, event.clientY);
      _movingToolWindow = this;
      [_lastX, _lastY] = [event.clientX, event.clientY];

      let movetarget = this.getContainerEl();
      movetarget.addEventListener("mousemove", _mousemove);
      movetarget.addEventListener("mouseup", _mouseend);
      movetarget.addEventListener("mouseleave", _mouseend);

      movetarget.classList.add("moving");
    }

    onWindowResize = () => {
      this.updatePositionState();
    }
  };

  let _lastX = null;
  let _lastY = null;
  let _movingToolWindow = null;
  let _mutationObservers = {};

  function _mousemove(event) {
    //console.log("ToolWindow.mousemove", event);
    let [curX, curY] = [event.clientX, event.clientY];
    let [diffX, diffY] = [curX - _lastX, curY - _lastY];
    //console.log("ToolWindow.mousemove", "diffX", diffX, "diffY", diffY);
    let newState = {
      left: _movingToolWindow.state.left + diffX,
      top: _movingToolWindow.state.top + diffY,
      manuallyPlaced: true,
    };
    newState = _keepInBounds(_movingToolWindow, newState);
    _movingToolWindow.setState(newState);

    [_lastX, _lastY] = [curX, curY];
  }

  function _mouseend(event) {
    //console.log("ToolWindow.mouseup", event);
    let movetarget = _movingToolWindow.getContainerEl();

    if (event.type === "mouseleave" && event.target !== movetarget)
      return;

    movetarget.removeEventListener("mousemove", _mousemove);
    movetarget.removeEventListener("mouseup", _mouseend);
    movetarget.removeEventListener("mouseleave", _mouseend);

    movetarget.classList.remove("moving");

    _movingToolWindow = null;
    _lastX = _lastY = null;
  }

  function _keepInBounds(toolwindow, newState) {
    if (newState.left < 0)
      newState.left = 0;
    else {
      let maxLeft = toolwindow.getContainerWidth() - toolwindow.getWidth();
      if (newState.left > maxLeft)
        newState.left = maxLeft;
    }
    if (newState.top < 0)
      newState.top = 0;
    else {
      let maxTop = toolwindow.getContainerHeight() - toolwindow.getHeight();
      if (newState.top > maxTop)
        newState.top = maxTop;
    }
    return newState;
  }

  return {
    ToolWindow
  };
})();
