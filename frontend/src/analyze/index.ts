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
  const messageNode = document.getElementById('progressMessage')!;
  const runningNode = document.getElementById('running')!;
  const questionsNode = document.getElementById('progressQuestions')!;
  const stdoutNode = document.getElementById('stdout')!;
  const params = getParams();
  if (params.database === null || params.id === null) {
    hydeElements([analyzeNode, runningNode, questionsNode, stdoutNode]);
    showElements([progressNode, messageNode]);
    setProgressMessage("Incomplete task specification.");
    return;
  }
  let status: any;
  try {
    status = await getStatus(params.database, params.id);
  } catch (ex) {
    hydeElements([analyzeNode, runningNode, questionsNode, stdoutNode]);
    showElements([progressNode, messageNode]);
    setProgressMessage("Failed to contact the server. <br/>\n" +
      "We will retry in a few seconds.");
    setTimeout(checkStatus, 15000);
    return;
  }
  if (status.statusCode === 404) {
    hydeElements([analyzeNode, runningNode, stdoutNode]);
    showElements([progressNode, messageNode, questionsNode]);
    setProgressMessage("Given prediction was not found.");
    return;
  }
  if (status.statusCode < 200 || status.statusCode > 299) {
    hydeElements([analyzeNode, runningNode, questionsNode, stdoutNode]);
    showElements([progressNode, questionsNode, messageNode]);
    setProgressMessage("Server send " + status.statusCode + " code. <br/>\n");
    return;
  }
  if (taskQueued(status.status)) {
    hydeElements([analyzeNode, questionsNode]);
    showElements([progressNode, messageNode, runningNode, stdoutNode]);
    setProgressMessage("Waiting in queue ...");
    setTimeout(checkStatus, 10000);
    return;
  }
  if (taskFinished(status.status)) {
    hydeElements([progressNode]);
    showElements([analyzeNode]);
    renderVisualisation(params.database, params.id);
    return;
  }
  if (taskFailed(status.status)) {
    hydeElements([analyzeNode, runningNode]);
    showElements([progressNode, messageNode, questionsNode, stdoutNode]);
    setProgressMessage("Task failed, see log bellow for more details.");
    renderProgress(params.database, params.id);
    return;
  }
  hydeElements([analyzeNode, questionsNode]);
  showElements([progressNode, runningNode, stdoutNode, messageNode]);
  setProgressMessage(
    "Please wait, running analysis ... <br/> " +
    "You can monitor progress in the log bellow. <br/> Please be patient, " +
    "some operations may take a longer time to compute.");
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

async function getStatus(database: string, id: string): Promise<object> {
  // We need to navigate to the root and then we can request the data.
  const url = getApiEndpoint(database, id) + "/status.json";
  return fetch(url).then((response) => {
    if (response.status !== 200) {
      return {
        "statusCode": response.status
      };
    }
    return response.json();
  });
}

function taskQueued(status: string): boolean {
  return status === "queued";
}

function taskFinished(status: string): boolean {
  return status === "successful";
}

function showElements(elements: Element[]) {
  for (const element of elements) {
    setElementClass(element, "hide-content", false);
  }
}

function setProgressMessage(text: string) {
  const failedText = document.getElementById('progressMessageText')!;
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

