PP64.controls = (function() {
  const Button = class Button extends React.Component {
    state = {}

    onClick = () => {
      this.props.onClick(this.props.id);
    }

    render() {
      let css = "nbButton";
      if (this.props.css)
        css += " " + this.props.css;
      return (
        <div className={css} onClick={this.onClick}>
          {this.props.children}
        </div>
      );
    }
  };

  const ToggleButton = class ToggleButton extends React.Component {
    state = {}

    onClick = () => {
      if (!this.props.allowDeselect && this.props.pressed)
        return;
      this.props.onToggled(this.props.id, !this.props.pressed);
    }

    render() {
      let css = "toggleButton" + (this.props.pressed ? " pressed" : "");
      if (this.props.css)
        css += " " + this.props.css;
      return (
        <div className={css} onClick={this.onClick}>
          {this.props.children}
        </div>
      );
    }
  };

  return {
    Button,
    ToggleButton,
  }

})();
