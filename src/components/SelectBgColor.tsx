import * as React from "react";

interface ColorItemProps {
  color: string;
}

class ColorItem extends React.Component<ColorItemProps> {
  render() {
    const { color } = this.props;
    return (
      <div>
        <div
          style={{
            height: "50px",
            width: "50px",
            borderRadius: "100%",
            backgroundColor: color,
            boxShadow: "0 0 0 3px #e78267",
          }}
        ></div>
        <p>{color}</p>
      </div>
    );
  }
}

interface SelectBgColorProps {
  changePage: () => void;
}

class SelectBgColor extends React.Component<SelectBgColorProps> {
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
    const { changePage } = this.props;
    console.log("colorsyo", colorOptions);
    return (
      <div>
        <p>
          Select the background layer of the intended glass pane and choose a
          color from the list
        </p>
        {!bgLayerSelected && <div className="sbc-colors-filler"></div>}
        {bgLayerSelected && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, 80px)",
              justifyContent: "center",
              justifyItems: "center",
            }}
          >
            {colorOptions.length &&
              colorOptions.map((color) => (
                <ColorItem key={color} color={color} />
              ))}
          </div>
        )}
        <div className="btn-row--alt">
          <button className="btn--center" onClick={changePage}>
            Next
          </button>
        </div>
      </div>
    );
  }
}

export default SelectBgColor;
