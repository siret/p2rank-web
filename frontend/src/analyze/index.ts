import LiteMol from "litemol";
import PrankWebSpec from "./specification";
import {render} from "./app";

(function initialize() {
  checkStatus();
})();

async function checkStatus() {
  const analyzeNode = document.getElementById("analyze")!;
  const progressNode = document.getElementById('progress')!;
  const params = getParams();
  const status = await getStatus(params.database, params.id);
  if (taskFinished(status)) {
    setElementClass(analyzeNode, "hide-content", false);
    setElementClass(progressNode, "hide-content", true);
    renderVisualisation(params.database, params.id);
    return;
  }
  setElementClass(analyzeNode, "hide-content", true);
  setElementClass(progressNode, "hide-content", false);
  renderProgress(params.database, params.id);
  setTimeout(checkStatus, 10000);
}

function getParams() {
  const path = window.location.pathname.split("/");
  const len = path.length;
  return {
    "database": path[len - 2],
    "id": path[len - 1]
  }
}

async function getStatus(database: string, id: string): Promise<string> {
  // We need to navigate to the root and then we can request the data.
  const url = "./../../api/" + database + "/" + id + "/status.json";
  return fetch(url).then((response) => {
    if (response.status !== 200) {
      throw new Error("Invalid response.");
    }
    return response.json();
  }).then((response) => response.status);
}

function taskFinished(status: string): boolean {
  return status === "successful";
}

function setElementClass(element: Element, className:string, active:boolean) {
  const actual = element.classList.contains(className);
  if (actual == active) {
    return;
  }
  if (active) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

function renderVisualisation(database: string, id: string) {
  const appNode = document.getElementById("app")!;
  const pocketNode = document.getElementById('pocket-list')!;
  const plugin = createPlugin(appNode);
  render(plugin, database, id, pocketNode);
}

function createPlugin(target: HTMLElement) {
  const plugin = LiteMol.Plugin.create({
    target,
    "viewportBackground": "#e7e7e7",
    "layoutState": {
      "hideControls": true,
      "isExpanded": false,
      "collapsedControlsLayout":
      LiteMol.Bootstrap.Components.CollapsedControlsLayout.Landscape,
    },
    "customSpecification": PrankWebSpec
  });
  plugin.context.logger.message(`LiteMol ${LiteMol.Plugin.VERSION.number}`);
  plugin.command(LiteMol.Bootstrap.Command.Layout.SetState, {
    "regionStates": {
      [LiteMol.Bootstrap.Components.LayoutRegion.Top]: "Sticky",
    }
  });
  return plugin;
}

function renderProgress(database: string, id: string) {
  const progressTextNode = document.getElementById("progress-text")!;
  const url = "./../../api/" + database + "/" + id + "/stdout";
  fetch(url).then((response) => {
    if (response.status !== 200) {
      throw new Error("Invalid response.");
    }
    return response.text()
  }).then((response) => {
    progressTextNode.innerText = response;
  });
}