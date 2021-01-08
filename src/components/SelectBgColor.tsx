import * as React from "react";

interface ColorItemProps {
  color: string;
  selectColor: (color: string) => void;
  selectedColor: string;
  deselectDefault: () => void;
}

class ColorItem extends React.Component<ColorItemProps> {
  getClassName = () => {
    const { color, selectedColor } = this.props;
    const defaultNames = "sbc-circle";
    let additionalNames = "";

    if (selectedColor === color) additionalNames = "sbc-circle--selected";

    return `${defaultNames} ${additionalNames}`;
  };
  render() {
    const { color, selectColor, deselectDefault } = this.props;

    return (
      <div
        onClick={() => {
          selectColor(color);
          deselectDefault();
        }}
      >
        <div
          className={this.getClassName()}
          style={{ backgroundColor: color }}
        ></div>
        <p>{color}</p>
      </div>
    );
  }
}

interface SelectBgColorProps {
  changePage: () => void;
  colorOptions: string[];
  bgLayerSelected: boolean;
  selectColor: (color: string) => void;
  selectedColor: string;
  defaultColor: string;
  defaultColorMarkup: JSX.Element | JSX.Element[];
}

class SelectBgColor extends React.Component<SelectBgColorProps> {
  state = {
    useDefaultColor: false,
  };

  deselectDefault = () => {
    this.setState({ useDefaultColor: false });
  };

  onCheckboxChange = () => {
    const { useDefaultColor } = this.state;
    const { selectColor, defaultColor } = this.props;
    //provide more uptodate state for useDefaultCOlor within this function
    const udc = !useDefaultColor;
    this.setState((prevState) => ({
      useDefaultColor: !prevState["useDefaultColor"],
    }));
    if (udc) {
      selectColor(defaultColor);
    } else {
      selectColor("");
    }
  };

  //if the back button is pressed the user wont be able to progress w/o reselecting a color.
  componentDidMount = () => {
    parent.postMessage(
      { pluginMessage: { type: "on-refracted-color-page" } },
      "*"
    );
    this.props.selectColor("");
  };

  render() {
    const {
      changePage,
      colorOptions,
      bgLayerSelected,
      selectColor,
      selectedColor,
      defaultColor,
      defaultColorMarkup,
    } = this.props;
    const { useDefaultColor } = this.state;
    console.log("colorsyo", colorOptions);
    return (
      <div>
        <h1 className="heading-1">Choose the refracted color</h1>
        <ul className="sbc-instructions">
          <li>Select the layer that's behind the intended glass pane</li>
          <br />
          <li>Choose a color from the list</li>
        </ul>
        {/* {!bgLayerSelected && <div className="sbc-colors-filler"></div>} */}
        <div
          style={{ display: "flex", alignItems: "center", margin: "30px 0" }}
        >
          <input
            type="checkbox"
            checked={useDefaultColor}
            onChange={this.onCheckboxChange}
          />
          Nevermind, I'll use &nbsp;
          {defaultColorMarkup}
          &nbsp; instead
        </div>
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
                <ColorItem
                  key={color}
                  color={color}
                  selectColor={selectColor}
                  selectedColor={selectedColor}
                  deselectDefault={this.deselectDefault}
                />
              ))}
          </div>
        )}
        <div className="sbc-btn-row">
          <button
            disabled={!selectedColor}
            className="btn--center"
            onClick={changePage}
          >
            Next
          </button>
        </div>
      </div>
    );
  }
}

export default SelectBgColor;
