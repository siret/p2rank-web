import React from "react";
import LiteMol from "litemol";
import {PolymerViewType, PocketsViewType} from "./app";

export default class ControlBox extends React.Component<{
  plugin: LiteMol.Plugin.Controller,
  downloadUrl: string,
  polymerView: PolymerViewType,
  pocketsView: PocketsViewType,
  onPolymerViewChange: (value: PolymerViewType) => void,
  onPocketsViewChange: (value: PocketsViewType) => void
}, {
  /**
   * True for expanded component false for minimized component.
   */
  visible: boolean
}> {

  state = {
    "visible": true,
  };

  constructor(props: any) {
    super(props);
    this.toggleVisible = this.toggleVisible.bind(this);
    this.toggleSequenceView = this.toggleSequenceView.bind(this);
  }

  render() {
    return (
      <div className="panel panel-default" style={{"marginTop": "1rem"}}>
        <div className="panel-heading">
          <h3 style={{"margin": "0"}}>
            Tools
            <button
              className="btn btn-default"
              type="button"
              title="Show/Hyde tools."
              style={{
                "float": "right",
                "font-size": "1.2rem",
                "padding": "0px 0.5rem 0px 0.5rem",
              }}
              onClick={this.toggleVisible}
            >
              {
                this.state.visible ?
                  <span style={{"fontFamily": "fontello"}}>
                    &#xe87f;
                  </span> :
                  <span style={{"fontFamily": "fontello"}}>
                    &#xe882;
                  </span>
              }
            </button>
          </h3>
        </div>
        {this.state.visible && <div className="panel-body">
          <ControlElements
            downloadUrl={this.props.downloadUrl}
            toggleSequenceView={this.toggleSequenceView}
            polymerView={this.props.polymerView}
            onPolymerViewChange={this.props.onPolymerViewChange}
            pocketsView={this.props.pocketsView}
            onPocketsViewChange={this.props.onPocketsViewChange}/>
        </div>
        }
      </div>
    );
  }

  toggleVisible() {
    this.setState({"visible": !this.state.visible});
  }

  toggleSequenceView() {
    let regionStates =
      this.props.plugin.context.layout.latestState.regionStates;
    if (!regionStates) {
      return;
    }
    let regionState = regionStates[LiteMol.Bootstrap.Components.LayoutRegion.Top];
    this.props.plugin.command(LiteMol.Bootstrap.Command.Layout.SetState, {
      "regionStates": {
        [LiteMol.Bootstrap.Components.LayoutRegion.Top]:
          regionState == "Sticky" ? "Hidden" : "Sticky",
      },
    })
  }

}

function ControlElements(
  props: {
    downloadUrl: string,
    toggleSequenceView: () => void,
    polymerView: PolymerViewType,
    onPolymerViewChange: (value: PolymerViewType) => void,
    pocketsView: PocketsViewType,
    onPocketsViewChange: (value: PocketsViewType) => void
  }) {
  return (
    <div>
      <div className="btn-group-vertical">
        <button
          type="button"
          className="btn btn-default"
          style={{"margin-bottom": "1rem"}}
          onClick={() => window.location.href = props.downloadUrl}
        >
          <span className="fontello-icon">&#xe82d;</span>
          Download
        </button>
        <button
          type="button"
          className="btn btn-default mb-1"
          style={{"margin-bottom": "1rem"}}
          onClick={props.toggleSequenceView}
        >
          <span className="fontello-icon">&#xe86d;</span>
          Toggle sequence view
        </button>
      </div>
      <div>
        <label htmlFor="polymer-visual">
          Peptide visualisation
        </label>
        <div>
          <select
            className="form-control"
            id="polymer-visual"
            value={props.polymerView}
            onChange={(event) =>
              props.onPolymerViewChange(parseInt(event.target.value))}
          >
            <option value="0">Balls and Sticks</option>
            <option value="1">Surface</option>
            <option value="2">Cartoon</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="pockets-visual">
          Pockets visualisation
        </label>
        <div>
          <select
            className="form-control"
            id="pockets-visual"
            value={props.pocketsView}
            onChange={(event) =>
              props.onPocketsViewChange(parseInt(event.target.value))}
          >
            <option value="0">Balls and Sticks</option>
            <option value="1">Surface</option>
          </select>
        </div>
      </div>
    </div>
  )
}