import React from "react";
import {PrankPocket, Colors} from "./prediction-entity";

export default class Pocket extends React.Component
  <{
    pocket: PrankPocket,
    index: number,
    conservationAvg: string,
    isVisible: boolean,
    setPocketVisibility: (index: number, isVisible: boolean) => void,
    showOnlyPocket: (index: number) => void,
    focusPocket: (index: number) => void,
    highlightPocket: (index: number, isHighlighted: boolean) => void
  }, {}> {

  constructor(props: any) {
    super(props);
    this.onPocketMouseEnter = this.onPocketMouseEnter.bind(this);
    this.onPocketMouseLeave = this.onPocketMouseLeave.bind(this);
    this.onPocketClick = this.onPocketClick.bind(this);
    this.showOnlyClick = this.showOnlyClick.bind(this);
    this.toggleVisibility = this.toggleVisibility.bind(this);
  }

  onPocketMouseEnter() {
    if (!this.props.isVisible) {
      return;
    }
    this.props.highlightPocket(this.props.index, true);
  }

  onPocketMouseLeave() {
    if (!this.props.isVisible) {
      return;
    }
    this.props.highlightPocket(this.props.index, false);
  }

  onPocketClick() {
    // Cannot focus on hidden pocket.
    if (!this.props.isVisible) {
      return;
    }
    this.props.focusPocket(this.props.index);
  }

  showOnlyClick() {
    this.props.showOnlyPocket(this.props.index);
  }

  toggleVisibility() {
    this.props.setPocketVisibility(
      this.props.index, !this.props.isVisible);
  }

  render() {
    const pocket = this.props.pocket;
    let iconDisplay = this.props.isVisible ? "inherit" : "none";
    const color = Colors.get(this.props.index % Colors.size);
    let borderColor = colorToRgbString(color);
    if (!this.props.isVisible) {
      borderColor = "gray";
    }
    return (
      <div className={"pocket"} style={{"borderColor": borderColor}}>
        <button
          style={{"float": "left"}}
          title="Show only this pocket"
          className="pocket-btn"
          onClick={this.showOnlyClick}
        >
          <span className="pocket-icon show-icon"/>
        </button>
        <button
          style={{
            "float": "left",
            "marginLeft": "1rem",
            display: iconDisplay
          }}
          title="Focus"
          className="pocket-btn"
          onClick={this.onPocketClick}
          onMouseEnter={this.onPocketMouseEnter}
          onMouseLeave={this.onPocketMouseLeave}
        >
          <span className="pocket-icon focus-icon"/>
        </button>
        <button
          style={{"float": "right"}}
          title="Show / Hide"
          className="pocket-btn"
          onClick={this.toggleVisibility}>
                  <span className={
                    this.props.isVisible ?
                      "pocket-icon show-icon" :
                      "pocket-icon hide-icon"}/>
        </button>
        <div style={{"clear": "both"}}/>
        <p style={{"float": "left"}} className="pocket-feature">
          Pocket rank:
        </p>
        <p style={{"float": "right"}}>
          {pocket.rank}
        </p>
        <div style={{"clear": "both"}}/>
        <p style={{"float": "left"}} className="pocket-feature">
          Pocket score:</p>
        <p style={{"float": "right"}}>
          {pocket.score}
        </p>
        <div style={{"clear": "both"}}/>
        <p style={{"float": "left"}} className="pocket-feature">
          AA count:
        </p>
        <p style={{"float": "right"}}>
          {pocket.residueIds.length}
        </p>
        <div style={{"clear": "both"}}/>
        <hr/>
        <p style={{"float": "left"}} className="pocket-feature">
          Conservation:
        </p>
        <p style={{"float": "right"}}>
          {this.props.conservationAvg}
        </p>
        <div style={{"clear": "both"}}/>
      </div>
    )
  }

}

function colorToRgbString(color: any) {
  return `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
}