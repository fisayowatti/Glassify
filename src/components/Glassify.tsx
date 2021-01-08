import * as React from "react";

interface GlassifyProps {
  glassifyMarkup: JSX.Element | JSX.Element[];
}

class Glassify extends React.Component<GlassifyProps> {
  componentDidMount() {
    parent.postMessage({ pluginMessage: { type: "on-glassify-page" } }, "*");
  }

  render() {
    return <>{this.props.glassifyMarkup}</>;
  }
}

export default Glassify;
