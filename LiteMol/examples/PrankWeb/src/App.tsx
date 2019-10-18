namespace LiteMol.PrankWeb.App {
    import React = LiteMol.Plugin.React;

    export function render(plugin: Plugin.Controller, inputType: string, inputId: string, target: HTMLElement) {
        LiteMol.Plugin.ReactDOM.render(
            <App plugin={plugin} inputType={inputType} inputId={inputId} />, target)
    }

    export class App extends React.Component<{ plugin: Plugin.Controller, inputId: string, inputType: string },
        { isLoading?: boolean, error?: string, data?: DataLoader.PrankData }> {

        state = { isLoading: false, data: void 0, error: void 0 };

        componentDidMount() {
            this.load();
        }

        load() {
            this.setState({ isLoading: true, error: void 0 });
            // Load data.
            DataLoader.loadData(this.props.plugin, this.props.inputType, this.props.inputId)
                // Visualize the data.
                .then((data) => DataLoader.visualizeData(this.props.plugin, data))
                // Color the protein surface and cartoon.
                .then((data) => DataLoader.colorProteinFuture(this.props.plugin, data))
                // Everything went well, change the loading state.
                .then((data) => this.setState({ isLoading: false, data }))
                // Something went wrong, change the loading state and set the error msg.
                .catch((e) => this.setState({ isLoading: false, error: '' + e }));
        }

        render() {
            if (this.state.data) {
                // Data available, display controls and pocket list.
                let controls: any[] = [];
                controls.push(<ControlButtons plugin={this.props.plugin} inputId={this.props.inputId} inputType={this.props.inputType}/>)
                controls.push(<PocketList data={this.state.data!} plugin={this.props.plugin} />)
                return <div>{controls}</div>
            } else {
                let controls: any[] = [];
                if (this.state.isLoading) {
                    controls.push(<h1>Loading...</h1>)
                } else {
                    // Offer a button to load data.
                    controls.push(<button onClick={() => this.load()}>Load data</button>)
                    if (this.state.error) {
                        controls.push(<div style={{ color: 'red', fontSize: '18px' }} >Error: {this.state.error}</div>)
                    }
                }
                return <div>{controls}</div>
            }
        }
    }

}