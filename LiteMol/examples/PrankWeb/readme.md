# PrankWeb using LiteMol
In this tutorial, I will briefly explain how I build PrankWeb website using LiteMol and pViz components. 

## Preliminaries
Before I start with the code, I will briefly explain the backend and its API that the website uses.

### RestAPI
The backend is written in Java and is powered by JBoss WildFly application server. The REST API is very simple:
A user can access either uploaded proteins or proteins from PDB database provided that they know its id.

To access **pdb** file:
```
mywebsite.com/api/{upload|id}/pdb/{pdbCode|uploadId}
```
To access the protein **seq**uence in JSON:
```
mywebsite.com/api/{upload|id}/seq/{pdbCode|uploadId}
```
To access the prediction **csv** file (output of [p2rank](http://siret.ms.mff.cuni.cz/p2rank) utility)
```
mywebsite.com/api/{upload|id}/csv/{pdbCode|uploadId}
```

## Creating plugin
When creating LiteMol plugin instance, one must set up its specification i.e. how the component should look like and what it is capable of. 
Use can check out the PrankWeb LiteMol specification [here](https://github.com/jendelel/LiteMol/blob/master/examples/PrankWeb/src/Specification.ts). I believe that the code is pretty self-explanatory.

We use `Plugin.create` function to create a new LiteMol plugin instance.  I also wrapped it into another function following David Sehnal's example to make the code more readable.
You pass LiteMol specification as an argument to create function as well as other properties such as the component layout.
Here is how I initilize the LiteMol plugin.
```
    export function create(target: HTMLElement) {
        let plugin = Plugin.create({
            target,
            viewportBackground: '#e7e7e7', // white
            layoutState: {
                hideControls: true, 
                isExpanded: false,
                collapsedControlsLayout: Bootstrap.Components.CollapsedControlsLayout.Landscape,
            },
            customSpecification: PrankWebSpec
        });
        plugin.context.logger.message(`LiteMol ${Plugin.VERSION.number}`);
        plugin.command(Bootstrap.Command.Layout.SetState, {
            regionStates: {[Bootstrap.Components.LayoutRegion.Top]: 'Sticky'}
        })
        return plugin;
    }

    // Div that LiteMol mounts into.
    let appNode = document.getElementById('app') !
    // Div that control panel mounts into.
    let pocketNode = document.getElementById('pocket-list') !

    // Specify what data to display.
    let inputType: string = appNode.getAttribute("data-input-type") !
    let inputId: string = appNode.getAttribute("data-input-id") !
    App.render(create(appNode), inputType, inputId, pocketNode);
```

## Components
LiteMol is written in React, which makes the code more readable and reusable. I created two main components: 
* `App` - control panel with a list pocket pockets
* `SequenceView` - sequence view of the protein using pViz.

### App component
This component is the main one controlling everything. It is responsible for loading all the data and displaying them using other components.
```
    export class App extends React.Component<{plugin:Plugin.Controller, inputId:string, inputType:string},
        {isLoading?:boolean, error?:string, data?: DataLoader.PrankData }> {

        state = {isLoading:false, data: void 0, error: void 0};

        componentDidMount() {
            this.load();
        }

        load() {
            this.setState({isLoading: true, error: void 0});
            // Load data.
            DataLoader.loadData(this.props.plugin, this.props.inputType,this.props.inputId)
                // Visualize the data
                .then((val: {plugin:Plugin.Controller, data:DataLoader.PrankData})=>DataLoader.visualizeData(val.plugin, val.data))
                // Everything went well, change the loading state.
                .then((data)=> this.setState({isLoading:false, data}))
                // Everything went wrong, change the loading state and set the error msg.
                .catch((e)=> this.setState({isLoading:false, error:'' + e}));
        }
        
        render() {
            if(this.state.data) {
                // Data available, display pocket list.
                return <PocketList data={this.state.data!} plugin={this.props.plugin}/>
            } else {
                let controls : any[] = [];
                if (this.state.isLoading) {
                    controls.push(<h1>Loading...</h1>)
                } else {
                    // Offer a button to load data.
                    controls.push(<button onClick={()=>this.load()}>Load data</button>)
                    if (this.state.error) {
                        controls.push(<div style={{color: 'red', fontSize:'18px'}} >Error: {this.state.error}</div>)
                    }
                }
                return <div>{controls}</div>
            }
        }
    }
```


#### Downloading data