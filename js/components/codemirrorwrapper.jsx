PP64.ns("components");

// Wrapper around the non-React CodeMirror library.
// Heavily based off of https://github.com/JedWatson/react-codemirror

Object.assign(PP64.components, function() {
  const CodeMirrorWrapper = class CodeMirrorWrapper extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      return (
        <div ref={el => {this.el = el;}}
          className={this.props.className}></div>
      );
    }

    componentDidMount() {
      const closureEl = this.el;
      this.codemirror = CodeMirror(function(el) {
        closureEl.appendChild(el);
      }, {
        value: this.props.value || this.props.defaultValue || "",
        extraKeys: {"Ctrl-Space": "autocomplete"},
      });
      this.codemirror.on("change", this.onInternalValueChanged);
    }

    componentWillUnmount() {
      this.codemirror = null;
    }

    componentWillReceiveProps(nextProps) {
      if (this.codemirror && nextProps.value !== undefined
        && nextProps.value !== this.props.value
        && PP64.utils.string.normalizeLineEndings(this.codemirror.getValue())
           !== PP64.utils.string.normalizeLineEndings(nextProps.value)) {
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

    onInternalValueChanged = (doc, change) => {
      if (this.props.onChange && change.origin !== "setValue") {
        this.props.onChange(doc.getValue(), change);
      }
    }

    setOptionIfChanged = (optionName, newValue) => {
      const oldValue = this.codemirror.getOption(optionName);
      if (!isEqual(oldValue, newValue)) {
        this.codemirror.setOption(optionName, newValue);
      }
    }
  }

  return {
    CodeMirrorWrapper,
  };
}());
