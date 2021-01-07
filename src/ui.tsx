import * as React from "react";
import * as ReactDOM from "react-dom";
import SelectBgColor from "./components/SelectBgColor";
import "./ui.css";

declare function require(path: string): any;

interface State {
  lightColor: string;
  bgColor: string;
  lastPage: boolean;

  bgLayerSelected: boolean;
  colorOptions: string[];
  selectedColor: string;
}

class App extends React.Component {
  textbox: HTMLInputElement;

  lightIntensity: HTMLInputElement;
  strokeWeight: HTMLInputElement;
  blur: HTMLInputElement;
  lightColor: HTMLInputElement;
  bgColor: HTMLInputElement;

  state: State = {
    lightColor: "#FFFFFF",
    bgColor: "#C4C4C4",
    lastPage: false,

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

  selectColor = (color: string) => {
    console.log(color);
    this.setState({ selectedColor: color });
  };

  lightIntensityRef = (element: HTMLInputElement) => {
    if (element) element.value = "90";
    this.lightIntensity = element;
  };

  strokeWeightRef = (element: HTMLInputElement) => {
    if (element) element.value = "3";
    this.strokeWeight = element;
  };

  blurRef = (element: HTMLInputElement) => {
    if (element) element.value = "42";
    this.blur = element;
  };

  lightColorRef = (element: HTMLInputElement) => {
    // if (element) element.value = this.state.lightColor;
    this.lightColor = element;
  };

  bgColorRef = (element: HTMLInputElement) => {
    // if (element) element.value = this.state.lightColor;
    this.bgColor = element;
  };

  onColorChange = (event) => {
    const { id, value }: { id: string; value: string } = event.target;
    console.log(id, value);

    switch (id) {
      case "bg-color":
        this.setState({ bgColor: value.toUpperCase() });
        return;
      case "light-color":
        this.setState({ lightColor: value.toUpperCase() });
        return;
      default:
        return;
    }
  };

  onCreate = () => {
    const count = parseInt(this.textbox.value, 10);
    parent.postMessage(
      { pluginMessage: { type: "create-rectangles", count } },
      "*"
    );
  };

  onCancel = () => {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  };

  onReset = () => {
    this.lightIntensity.value = "90";
    this.strokeWeight.value = "3";
    this.blur.value = "42";

    this.setState({
      lightColor: "#FFFFFF",
      bgColor: "#C4C4C4",
    });
  };

  onGlassify = () => {
    const lightIntensity = parseInt(this.lightIntensity.value);
    const lightColor = this.state.lightColor;
    const bgColor = this.state.selectedColor;
    const strokeWeight = parseInt(this.strokeWeight.value, 10);
    const blur = Math.min(250, parseInt(this.blur.value));

    parent.postMessage(
      {
        pluginMessage: {
          type: "glassify",
          lightIntensity,
          lightColor,
          bgColor,
          strokeWeight,
          blur,
        },
      },
      "*"
    );
  };

  changePage = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "deselect-all-selections",
        },
      },
      "*"
    );
    this.setState({ lastPage: !this.state.lastPage });
  };

  render() {
    const {
      lastPage,
      bgLayerSelected,
      colorOptions,
      selectedColor,
      bgColor,
    } = this.state;
    return (
      <div>
        {/* <img src={require("./logo.svg")} />
        <Heading />
        <p>
          Count: <input ref={this.countRef} />
        </p>
        <button id="create" onClick={this.onCreate}>
          Create
        </button>
        <button onClick={this.onCancel}>Cancel</button> */}
        {!lastPage && (
          <SelectBgColor
            bgLayerSelected={bgLayerSelected}
            colorOptions={colorOptions}
            changePage={this.changePage}
            selectColor={this.selectColor}
            selectedColor={selectedColor}
            defaultColor={bgColor}
            defaultColorMarkup={
              <div style={{ display: "inline-block" }}>
                <div
                  style={{
                    justifySelf: "center",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="color"
                    id="bg-color"
                    name="bg-color"
                    value={this.state.bgColor}
                    onChange={this.onColorChange}
                    ref={this.bgColorRef}
                  />
                  <span
                    // id="light-color-label"
                    onClick={() => this.bgColor.click()}
                  >
                    {this.state.bgColor}
                  </span>
                </div>
              </div>
            }
          />
        )}
        {lastPage && (
          <div className="container">
            <div id="back" onClick={this.changePage}>
              <svg
                width="20"
                height="17"
                viewBox="0 0 20 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.5859 7.25495H4.53576L9.9972 1.76072L8.5382 0.292969L0.585938 8.29297L8.5382 16.293L9.9972 14.8252L4.53576 9.33099H19.5859V7.25495Z"
                  fill="black"
                />
              </svg>
            </div>
            <p>
              Select the object you want to glassify before clicking the blue
              button.
            </p>
            <h1 className="heading-1 heading">Light</h1>
            <div className="light-row">
              {/* <div> */}
              <h2 className="heading-2">Intensity</h2>
              <div
                className="slider-container"
                style={{ justifySelf: "center" }}
              >
                {/* <img
                  id="sun-icon-small"
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9InN1bi1pY29uIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTcuOTA5NTYgMTQuOTk5OUM3LjkwOTU2IDE4LjkxMTMgMTEuMDkxNCAyMi4wOTMyIDE1LjAwMjggMjIuMDkzMkMxOC45MTQyIDIyLjA5MzIgMjIuMDk2MSAxOC45MTEzIDIyLjA5NjEgMTQuOTk5OUMyMi4wOTYxIDExLjA4ODUgMTguOTE0MiA3LjkwNjY3IDE1LjAwMjggNy45MDY2N0MxMS4wOTE0IDcuOTA2NjcgNy45MDk1NiAxMS4wODg1IDcuOTA5NTYgMTQuOTk5OVpNMTMuNTgzMyAyNC45MTY2SDE2LjQxNjZWMjkuMTY2NkgxMy41ODMzVjI0LjkxNjZaTTEzLjU4MzMgMC44MzMyNTJIMTYuNDE2NlY1LjA4MzI1SDEzLjU4MzNWMC44MzMyNTJaTTAuODMzMzEzIDEzLjU4MzNINS4wODMzMVYxNi40MTY2SDAuODMzMzEzVjEzLjU4MzNaTTI0LjkxNjYgMTMuNTgzM0gyOS4xNjY2VjE2LjQxNjZIMjQuOTE2NlYxMy41ODMzWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggaWQ9IlZlY3Rvcl8yIiBkPSJNNS45ODU3NyAyNi4wMTg5TDMuOTgyNiAyNC4wMTU3TDYuOTg3MzUgMjEuMDExTDguOTkwNTIgMjMuMDE0Mkw1Ljk4NTc3IDI2LjAxODlaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBpZD0iVmVjdG9yXzMiIGQ9Ik0yMS4wMDk1IDYuOTg3NDlMMjQuMDE1NyAzLjk4MTMyTDI2LjAxODkgNS45ODQ0OUwyMy4wMTI3IDguOTkwNjZMMjEuMDA5NSA2Ljk4NzQ5WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggaWQ9IlZlY3Rvcl80IiBkPSJNNi45ODczNSA4Ljk5MjEyTDMuOTgyNiA1Ljk4NTk1TDUuOTg3MTkgMy45ODI3OUw4Ljk5MDUyIDYuOTg4OTVMNi45ODczNSA4Ljk5MjEyWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggaWQ9IlZlY3Rvcl81IiBkPSJNMjYuMDE4OSAyNC4wMTU4TDI0LjAxNTcgMjYuMDE5TDIxLjAwOTUgMjMuMDEyOEwyMy4wMTI3IDIxLjAwOTZMMjYuMDE4OSAyNC4wMTU4WiIgZmlsbD0iYmxhY2siLz4KPC9nPgo8L3N2Zz4K"
                /> */}

                <input
                  type="range"
                  id="light-intensity"
                  name="light-intensity"
                  min="10"
                  max="100"
                  step="10"
                  ref={this.lightIntensityRef}
                />

                {/* <img
                  id="sun-icon-large"
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9InN1bi1pY29uIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTcuOTA5NTYgMTQuOTk5OUM3LjkwOTU2IDE4LjkxMTMgMTEuMDkxNCAyMi4wOTMyIDE1LjAwMjggMjIuMDkzMkMxOC45MTQyIDIyLjA5MzIgMjIuMDk2MSAxOC45MTEzIDIyLjA5NjEgMTQuOTk5OUMyMi4wOTYxIDExLjA4ODUgMTguOTE0MiA3LjkwNjY3IDE1LjAwMjggNy45MDY2N0MxMS4wOTE0IDcuOTA2NjcgNy45MDk1NiAxMS4wODg1IDcuOTA5NTYgMTQuOTk5OVpNMTMuNTgzMyAyNC45MTY2SDE2LjQxNjZWMjkuMTY2NkgxMy41ODMzVjI0LjkxNjZaTTEzLjU4MzMgMC44MzMyNTJIMTYuNDE2NlY1LjA4MzI1SDEzLjU4MzNWMC44MzMyNTJaTTAuODMzMzEzIDEzLjU4MzNINS4wODMzMVYxNi40MTY2SDAuODMzMzEzVjEzLjU4MzNaTTI0LjkxNjYgMTMuNTgzM0gyOS4xNjY2VjE2LjQxNjZIMjQuOTE2NlYxMy41ODMzWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggaWQ9IlZlY3Rvcl8yIiBkPSJNNS45ODU3NyAyNi4wMTg5TDMuOTgyNiAyNC4wMTU3TDYuOTg3MzUgMjEuMDExTDguOTkwNTIgMjMuMDE0Mkw1Ljk4NTc3IDI2LjAxODlaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBpZD0iVmVjdG9yXzMiIGQ9Ik0yMS4wMDk1IDYuOTg3NDlMMjQuMDE1NyAzLjk4MTMyTDI2LjAxODkgNS45ODQ0OUwyMy4wMTI3IDguOTkwNjZMMjEuMDA5NSA2Ljk4NzQ5WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggaWQ9IlZlY3Rvcl80IiBkPSJNNi45ODczNSA4Ljk5MjEyTDMuOTgyNiA1Ljk4NTk1TDUuOTg3MTkgMy45ODI3OUw4Ljk5MDUyIDYuOTg4OTVMNi45ODczNSA4Ljk5MjEyWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggaWQ9IlZlY3Rvcl81IiBkPSJNMjYuMDE4OSAyNC4wMTU4TDI0LjAxNTcgMjYuMDE5TDIxLjAwOTUgMjMuMDEyOEwyMy4wMTI3IDIxLjAwOTZMMjYuMDE4OSAyNC4wMTU4WiIgZmlsbD0iYmxhY2siLz4KPC9nPgo8L3N2Zz4K"
                /> */}
              </div>
              {/* </div> */}
              {/* <div> */}
              <h2 className="heading-2">Color</h2>
              <div
                style={{
                  justifySelf: "center",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="color"
                  id="light-color"
                  name="light-color"
                  value={this.state.lightColor}
                  onChange={this.onColorChange}
                  ref={this.lightColorRef}
                />
                <span
                  id="light-color-label"
                  onClick={() => this.lightColor.click()}
                >
                  {this.state.lightColor}
                </span>
              </div>
              {/* </div> */}
            </div>

            <h1 className="heading-1 heading">Pane</h1>
            <div className="pane-row">
              {/* <div> */}
              {/* <h2 className="heading-2">Refracted color</h2>
              <div>
                <input
                  type="color"
                  id="bg-color"
                  name="bg-color"
                  value={this.state.bgColor}
                  onChange={this.onColorChange}
                />
                <span id="bg-color-label">{this.state.bgColor}</span>
              </div> */}
              {/* </div> */}
              {/* <div> */}
              <h2 className="heading-2">Stroke weight</h2>
              <input
                type="number"
                className="input"
                id="stroke-weight"
                ref={this.strokeWeightRef}
                style={{ justifySelf: "center" }}
              />
              {/* </div> */}
              {/* <div> */}
              <h2 className="heading-2">Blur</h2>
              <input
                type="number"
                className="input"
                id="blur"
                max="250"
                ref={this.blurRef}
                style={{ justifySelf: "center" }}
              />
              {/* </div> */}
            </div>
            <div className="btn-row">
              <button className="btn" id="glassify" onClick={this.onGlassify}>
                Glassify
              </button>
              <button id="reset" onClick={this.onReset}>
                <svg
                  width="18"
                  height="17"
                  viewBox="0 0 18 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.5 1.5C3.086 2.877 1.5 5.522 1.5 8.5C1.5 10.0823 1.96919 11.629 2.84824 12.9446C3.72729 14.2602 4.97672 15.2855 6.43853 15.891C7.90034 16.4965 9.50887 16.655 11.0607 16.3463C12.6126 16.0376 14.038 15.2757 15.1569 14.1569C16.2757 13.038 17.0376 11.6126 17.3463 10.0607C17.655 8.50887 17.4965 6.90034 16.891 5.43853C16.2855 3.97672 15.2602 2.72729 13.9446 1.84824C12.629 0.969192 11.0823 0.5 9.5 0.5"
                    stroke="black"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M5.5 6.5V1.5H0.5"
                    stroke="black"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Reset Values
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("react-page"));
