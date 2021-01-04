import * as React from "react";

interface ColorItemProps {
  color: string;
}

class ColorItem extends React.Component<ColorItemProps> {
  render() {
    return (
      <div>
        <div
          style={{
            height: "50px",
            width: "50px",
            borderRadius: "100%",
            backgroundColor: this.props["color"],
          }}
        ></div>
      </div>
    );
  }
}

class SelectBgColor extends React.Component {
  state = {
    bgLayerSelected: false,
    colorOptions: [],
    selectedColor: "",
  };

  componentDidMount() {
    window.onmessage = async (event) => {
      const message = event.data.pluginMessage;
      if (message.type === "refracted-color-options") {
        this.setState({ colorOptions: message.colors });
      }
      if (message.type === "selection-made") {
        this.setState({ bgLayerSelected: message.isValid });
      }
      console.log("omo", message);
    };
  }

  render() {
    const { bgLayerSelected, colorOptions } = this.state;
    console.log("colorsyo", colorOptions);
    return (
      <div>
        <p>
          Select the background layer of the intended glass pane and choose a
          color from the list that comes up
        </p>
        {!bgLayerSelected && <div className="sbc-colors-filler"></div>}
        {colorOptions.length &&
          colorOptions.map((color) => <ColorItem color={color} />)}
      </div>
    );
  }
}

export default SelectBgColor;
