import React from "react";
import Pocket from "./pocket";
import {PrankPocket} from "./prediction-entity";

export default class PocketList extends React.Component
  <{
    pockets: {
      pocket: PrankPocket,
      conservation: string,
      isVisible: boolean,
      selection: any,
    }[],
    showAll: () => void,
    setPocketVisibility: (index: number, isVisible: boolean) => void,
    showOnlyPocket: (index: number) => void,
    focusPocket: (index: number) => void,
    highlightPocket: (index: number, isHighlighted: boolean) => void
  }, {}> {

  render() {
    return (
      <div className="pockets">
        <h3 className="text-center">
          Pockets
          <button
            title="Show all"
            className="show-all-button"
            onClick={this.props.showAll}
          >
            <span className="icon"/>
          </button>
        </h3>
        {this.props.pockets.map((item, index) => (
          <Pocket
            key={index}
            pocket={item.pocket}
            index={index}
            conservationAvg={item.conservation}
            isVisible={item.isVisible}
            setPocketVisibility={this.props.setPocketVisibility}
            showOnlyPocket={this.props.showOnlyPocket}
            focusPocket={this.props.focusPocket}
            highlightPocket={this.props.highlightPocket}
          />
        ))}
      </div>);
  }

}