import * as React from "react";
import * as ReactDOM from "react-dom";
import Heading from "./components/Heading";
import SelectBgColor from "./components/SelectBgColor";
import "./ui.css";

declare function require(path: string): any;

interface State {
  lightColor: string;
  bgColor: string;
}

class App extends React.Component {
  textbox: HTMLInputElement;

  lightIntensity: HTMLInputElement;
  strokeWeight: HTMLInputElement;
  blur: HTMLInputElement;

  state: State = {
    lightColor: "#FFFFFF",
    bgColor: "#C4C4C4",
  };

  countRef = (element: HTMLInputElement) => {
    if (element) element.value = "5";
    this.textbox = element;
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
    const bgColor = this.state.bgColor;
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

  render() {
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

        <SelectBgColor />

        <div className="container">
          <h1 className="heading-1">Light</h1>
          <div className="light-row">
            {/* <div> */}
            <h2 className="heading-2">Intensity</h2>
            <div className="slider-container">
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
            <div>
              <input
                type="color"
                id="light-color"
                name="light-color"
                value={this.state.lightColor}
                onChange={this.onColorChange}
              />
              <span id="light-color-label">{this.state.lightColor}</span>
            </div>
            {/* </div> */}
          </div>

          <h1 className="heading-1 pane">Pane</h1>
          <div className="pane-row">
            {/* <div> */}
            <h2 className="heading-2">Refracted color</h2>
            <div>
              <input
                type="color"
                id="bg-color"
                name="bg-color"
                value={this.state.bgColor}
                onChange={this.onColorChange}
              />
              <span id="bg-color-label">{this.state.bgColor}</span>
            </div>
            {/* </div> */}
            {/* <div> */}
            <h2 className="heading-2">Stroke weight</h2>
            <input
              type="number"
              className="input"
              id="stroke-weight"
              ref={this.strokeWeightRef}
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
            />
            {/* </div> */}
          </div>
          <div className="btn-row">
            <button id="reset" onClick={this.onReset}>
              Reset
            </button>
            <button className="btn" id="glassify" onClick={this.onGlassify}>
              Glassify
            </button>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("react-page"));
