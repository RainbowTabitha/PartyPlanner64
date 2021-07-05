import React from "react";

interface IBasicErrorBoundaryState {
    hasError: boolean;
  }

/** Component that wraps children in an error boundary. */
export class BasicErrorBoundary extends React.Component<{}, IBasicErrorBoundaryState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      hasError: false
    };
  }

  render() {
    if (this.state.hasError) {
      return <p>An error was encountered.</p>;
    }

    return this.props.children;
  }

  componentDidCatch(error: unknown) {
    this.setState({ hasError: true });
    console.error(error);
  }
}
