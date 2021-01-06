import * as React from "react";

interface ColorItemProps {
  color: string;
  selectColor: (color: string) => void;
  selectedColor: string;
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
    const { color, selectColor } = this.props;

    return (
      <div onClick={() => selectColor(color)}>
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
  defaultColorRef: (element: HTMLInputElement) => void;
  defaultColorElement: HTMLInputElement;
  onColorChange: (event) => void;
  defaultColorComponent: JSX.Element | JSX.Element[];
}

class SelectBgColor extends React.Component<SelectBgColorProps> {
  state = {
    useDefaultColor: false,
  };

  render() {
    const {
      changePage,
      colorOptions,
      bgLayerSelected,
      selectColor,
      selectedColor,
      defaultColor,
      defaultColorRef,
      onColorChange,
      defaultColorElement,
      defaultColorComponent,
    } = this.props;
    const { useDefaultColor } = this.state;
    console.log("colorsyo", colorOptions);
    return (
      <div>
        <h1>Choose the refracted color</h1>
        <p>
          Select the background layer of the intended glass pane and choose a
          color from the list
        </p>
        {/* {!bgLayerSelected && <div className="sbc-colors-filler"></div>} */}
        <div>
          <input
            type="checkbox"
            checked={useDefaultColor}
            onChange={() =>
              this.setState({ useDefaultColor: !useDefaultColor })
            }
          />
          Nevermind, I'll use
          {defaultColorComponent}
          {/* <span
            style={{
              justifySelf: "center",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              type="color"
              id="light-color"
              //   name="light-color"
              value={defaultColor}
              onChange={onColorChange}
              ref={defaultColorRef}
            />
            <span
              id="light-color-label"
              onClick={() => defaultColorElement.click()}
            >
              {defaultColor}
            </span>
          </span> */}
          instead
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
