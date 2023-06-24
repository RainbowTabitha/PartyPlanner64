import * as React from "react";
import { makeKeyClick } from "./utils/react";

export interface IButtonProps {
  children?: React.ReactNode;
  id?: string;
  css?: string;
  title?: string;
  onClick: (id?: string) => any;
}

export const Button = class Button extends React.Component<IButtonProps> {
  state = {};

  onClick = () => {
    this.props.onClick(this.props.id);
  };

  render() {
    let css = "nbButton";
    if (this.props.css) css += " " + this.props.css;
    return (
      <div
        className={css}
        title={this.props.title}
        tabIndex={0}
        onClick={this.onClick}
        onKeyDown={makeKeyClick(this.onClick)}
      >
        {this.props.children}
      </div>
    );
  }
};

export interface IToggleButtonProps {
  children?: React.ReactNode;
  allowDeselect?: boolean;
  id: string | number;
  pressed?: boolean;
  readonly?: boolean;
  css?: string;
  title?: string;
  onToggled: (id: any, pressed: boolean) => any;
}

export const ToggleButton = class ToggleButton extends React.Component<IToggleButtonProps> {
  state = {};

  onClick = () => {
    if (this.props.readonly) {
      return;
    }
    if (this.props.allowDeselect === false && this.props.pressed) {
      return;
    }
    this.props.onToggled(this.props.id, !this.props.pressed);
  };

  render() {
    let css = "toggleButton" + (this.props.pressed ? " pressed" : "");
    if (this.props.css) css += " " + this.props.css;
    return (
      <div
        className={css}
        title={this.props.title}
        tabIndex={0}
        onClick={this.onClick}
        onKeyDown={makeKeyClick(this.onClick)}
      >
        {this.props.children}
      </div>
    );
  }
};

export interface IToggleItem<Tid> {
  id: Tid;
  selected: boolean;
  title?: string;
  text: string;
}

export interface IToggleGroupProps<Tid = number | string> {
  onToggleClick: (id: Tid, pressed: boolean) => any;
  groupCssClass?: string;
  items: IToggleItem<Tid>[];
  allowDeselect?: boolean;
  readonly?: boolean;
}

export function ToggleGroup<Tid extends number | string>(
  props: IToggleGroupProps<Tid>
) {
  const items = props.items;
  const toggles = items.map((item) => {
    return (
      <ToggleButton
        id={item.id}
        key={item.id}
        pressed={item.selected}
        allowDeselect={props.allowDeselect}
        readonly={props.readonly}
        title={item.title}
        onToggled={props.onToggleClick}
      >
        {item.text}
      </ToggleButton>
    );
  });

  return <div className={props.groupCssClass}>{toggles}</div>;
}
