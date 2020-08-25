import LiteMol from "litemol";
import PrankWebSpec from "./specification";
import {render} from "./app";
import {getApiEndpoint} from "./configuration";

(function initialize() {
  checkStatus();
})();

async function checkStatus() {
  const analyzeNode = document.getElementById("analyze")!;
  const progressNode = document.getElementById('progress')!;
  const requestFailedNode = document.getElementById('requestFailed')!;
  const runningNode = document.getElementById('running')!;
  const failedNode = document.getElementById('failed')!;
  const stdoutNode = document.getElementById('stdout')!;
  const params = getParams();
  if (params.database === null || params.id === null) {
    hydeElements([analyzeNode, runningNode, failedNode, stdoutNode]);
    showElements([progressNode, requestFailedNode]);
    setFailedHtml("Incomplete task specification.");
    return;
  }
  let status;
  try {
    status = await getStatus(params.database, params.id);
  } catch (ex) {
    hydeElements([analyzeNode, runningNode, failedNode, stdoutNode]);
    showElements([progressNode, requestFailedNode]);
    setFailedHtml("Failed to contact the server. <br/>\n" +
      "We will retry in a few seconds.");
    setTimeout(checkStatus, 15000);
    return;
  }
  if (taskFinished(status)) {
    hydeElements([progressNode]);
    showElements([analyzeNode]);
    renderVisualisation(params.database, params.id);
    return;
  }
  //
  if (taskFailed(status)) {
    hydeElements([analyzeNode, requestFailedNode, runningNode]);
    showElements([progressNode, failedNode, stdoutNode]);
    renderProgress(params.database, params.id);
    return;
  }
  hydeElements([analyzeNode, requestFailedNode, failedNode]);
  showElements([progressNode, runningNode, stdoutNode]);
  renderProgress(params.database, params.id);
  setTimeout(checkStatus, 5000);
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    "database": params.get("database"),
    "id": params.get("code"),
  }
}

async function getStatus(database: string, id: string): Promise<string> {
  // We need to navigate to the root and then we can request the data.
  const url = getApiEndpoint(database, id);
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

function showElements(elements: Element[]) {
  for (const element of elements) {
    setElementClass(element, "hide-content", false);
  }
}

function setFailedHtml(text:string) {
  const failedText = document.getElementById('requestFailedText')!;
  failedText.innerHTML = text;
}

function hydeElements(elements: Element[]) {
  for (const element of elements) {
    setElementClass(element, "hide-content", true);
  }
}

function setElementClass(element: Element, className: string, active: boolean) {
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


function taskFailed(status: string): boolean {
  return status === "failed";
}

function renderProgress(database: string, id: string) {
  const progressTextNode = document.getElementById("progress-text")!;
  const url = getApiEndpoint(database, id) + "/stdout";
  fetch(url).then((response) => {
    if (response.status !== 200) {
      throw new Error("Invalid response.");
    }
    return response.text()
  }).then((response) => {
    progressTextNode.innerText = response;
  });
}

