namespace PP64.controls {
  export interface IButtonProps {
    onClick: (id: string) => any;
    id: string;
    css?: string;
    title?: string;
  }

  export const Button = class Button extends React.Component<IButtonProps> {
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

  export interface IToggleButtonProps {
    onToggled: (id: string, pressed: boolean) => any;
    allowDeselect?: boolean;
    id: string;
    pressed?: boolean;
    css?: string;
    title?: string;
  }

  export const ToggleButton = class ToggleButton extends React.Component<IToggleButtonProps> {
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

  export interface IToggleGroupProps {
    onToggleClick: (id: string, pressed: boolean) => any;
    groupCssClass?: string;
    items: { id: string, selected: boolean, title: string, text: string }[];
    allowDeselect?: boolean;
  }

  export const ToggleGroup = class ToggleGroup extends React.Component<IToggleGroupProps> {
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
}
