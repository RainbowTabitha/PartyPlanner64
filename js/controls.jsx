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
        <div className={css} title={this.props.title} tabIndex={0}
          onClick={this.onClick}
          onKeyDown={PP64.utils.react.makeKeyClick(this.onClick, this)}>
          {this.props.children}
        </div>
      );
    }
  };

  const ToggleButton = class ToggleButton extends React.Component {
    state = {}

    onClick = () => {
      if (this.props.allowDeselect === false && this.props.pressed)
        return;
      this.props.onToggled(this.props.id, !this.props.pressed);
    }

    render() {
      let css = "toggleButton" + (this.props.pressed ? " pressed" : "");
      if (this.props.css)
        css += " " + this.props.css;
      return (
        <div className={css} title={this.props.title} tabIndex={0}
          onClick={this.onClick}
          onKeyDown={PP64.utils.react.makeKeyClick(this.onClick, this)}>
          {this.props.children}
        </div>
      );
    }
  };

  const ToggleGroup = class ToggleGroup extends React.Component {
    state = {}

    render() {
      const items = this.props.items;
      let toggles = items.map(item => {
        return (
          <ToggleButton id={item.id}
            key={item.id}
            pressed={item.selected}
            allowDeselect={this.props.allowDeselect}
            title={item.title}
            onToggled={this.props.onToggleClick}>
            {item.text}
          </ToggleButton>
        );
      });

      return (
        <div className={this.props.groupCssClass}>
          {toggles}
        </div>
      );
    }
  }

  return {
    Button,
    ToggleButton,
    ToggleGroup,
  };
})();
