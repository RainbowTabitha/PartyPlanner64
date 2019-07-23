import * as React from "react";
import * as CodeMirror from "codemirror";
import { normalizeLineEndings } from "../utils/string";
import "../utils/lib/mp-mips-autocomplete";
import "../utils/lib/mp-mips-codemirror";

export interface ICodeMirrorWrapperProps {
  className?: string;
  value?: string;
  defaultValue?: string;
  preserveScrollPosition?: boolean;
  options?: any;
  onChange: Function;
}

/**
 * Wrapper around the non-React CodeMirror library.
 * Heavily based off of https://github.com/JedWatson/react-codemirror
 */
export class CodeMirrorWrapper extends React.Component<ICodeMirrorWrapperProps> {
  private el: HTMLElement | null = null;
  private codemirror: CodeMirror.Editor | null = null;

  render() {
    return (
      <div ref={el => {this.el = el;}}
        className={this.props.className}></div>
    );
  }

  componentDidMount() {
    const closureEl = this.el!;
    this.codemirror = (CodeMirror as any)(function(el: HTMLElement) {
      closureEl.appendChild(el);
    }, {
      value: this.props.value || this.props.defaultValue || "",
      extraKeys: {"Ctrl-Space": "autocomplete"},
    }) as CodeMirror.Editor;
    this.codemirror.on("change", this.onInternalValueChanged);
  }

  componentWillUnmount() {
    this.codemirror = null;
  }

  componentWillReceiveProps(nextProps: ICodeMirrorWrapperProps) {
    if (this.codemirror && nextProps.value !== undefined
      && nextProps.value !== this.props.value
      && normalizeLineEndings(this.codemirror.getValue())
          !== normalizeLineEndings(nextProps.value)) {
      if (this.props.preserveScrollPosition) {
        var prevScrollPosition = this.codemirror.getScrollInfo();
        this.codemirror.setValue(nextProps.value);
        this.codemirror.scrollTo(prevScrollPosition.left, prevScrollPosition.top);
      } else {
        this.codemirror.setValue(nextProps.value);
      }
    }
    if (typeof nextProps.options === "object") {
      for (let optionName in nextProps.options) {
        if (nextProps.options.hasOwnProperty(optionName)) {
          this.setOptionIfChanged(optionName, nextProps.options[optionName]);
        }
      }
    }
  }

  onInternalValueChanged = (doc: any, change: any) => {
    if (this.props.onChange && change.origin !== "setValue") {
      this.props.onChange(doc.getValue(), change);
    }
  }

  setOptionIfChanged = (optionName: string, newValue: any) => {
    // const oldValue = this.codemirror!.getOption(optionName);
    // if (!isEqual(oldValue, newValue)) {
    //   this.codemirror!.setOption(optionName, newValue);
    // }
  }
}
