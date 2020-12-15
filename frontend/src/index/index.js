function uploadPdbFile() {
  const structurePdb = getPdb();
  const structureFiles = $("#upload-pdb").get(0).files;
  const doConservation = $("#conservation-checkbox").prop("checked");
  const msaFiles = $("#upload-msas").get(0).files;
  const msaPdb = $("#pdbId_opt").val();
  // Prepare booleans to decide how to upload.
  const structurePdbProvided = isValidPdbId(structurePdb);
  const structureFilesProvided = structureFiles.length > 0;
  const msaPdbProvided = isValidPdbId(msaPdb);
  const msaFilesProvided = msaFiles.length > 0;
  //
  if (structureFilesProvided) {
    if (doConservation) {
      if (msaFilesProvided) {
        submitStructureFileWithMsa(structureFiles, msaFiles);
      } else if (msaPdbProvided) {
        submitStructureFileWithHssp(structureFiles, msaPdb);
      } else {
        submitStructureFile(structureFiles);
      }
    } else {
      submitStructureFileNoConservation(structureFiles);
    }
  } else {
    if (!structurePdbProvided) {
      alert("Please select some files to upload or enter valid PDB ID.");
      return;
    }
    if (doConservation) {
      if (msaFilesProvided) {
        submitStructurePdbWithMsa(structurePdb, msaFiles);
      } else {
        // User provided structure PDB ID, and want to use conservation.
        submitStructurePdb(structurePdb);
      }
    } else {
      // User provided structure PDB ID, no conservation used.
      submitStructurePdbNoConservation(structurePdb);
    }
  }
}

function getPdb() {
  const value = document.getElementById("pdbId").value;
  if (value === "") {
    return "2src";
  }
  return value;
}

function isValidPdbId(pdbId) {
  return pdbId.length === 4 && /^[a-zA-Z0-9]*$/.test(pdbId);
}

//
// Submit functions.
//

function submitStructureFileWithMsa(structureFiles, msaFiles) {
  const formData = new FormData();
  addStructureFileToFormData(formData, structureFiles);
  addMsaFilesToFormData(formData, msaFiles);
  formData.append(
    "input",
    asJsonBlob({
      "conservation": true,
      "chains": getUserChainArray(),
    }),
    "configuration.json");
  sendPostRequest("./api/v2-user-upload", formData);
}

function addStructureFileToFormData(formData, structureFiles) {
  for (let file of structureFiles) {
    formData.append("input", file, "structure.pdb");
  }
}

function addMsaFilesToFormData(formData, msaPdb) {
  for (let file of msaPdb) {
    formData.append("input", file, "msa.fasta");
  }
}

function asJsonBlob(content) {
  return new Blob([JSON.stringify(content)], {"type": "text/json"});
}

function getUserChainArray() {
  const chains = $("#fileChains").val();
  return chains.split(",");
}

function sendPostRequest(url, formData) {
  $.ajax({
    "url": url,
    "type": "POST",
    "contentType": false,
    "data": formData,
    "processData": false,
    "success": function (data, status, request) {
      const database = request.getResponseHeader("task-runner-template");
      const task = request.getResponseHeader("task-runner-task");
      window.location.href = createUrl(database, task, []);
    },
  });
}

function submitStructureFileWithHssp(structureFiles, hsspCode) {
  const formData = new FormData();
  addStructureFileToFormData(formData, structureFiles);
  formData.append(
    "input",
    asJsonBlob({
      "conservation": true,
      "chains": getUserChainArray(),
      "hssp": hsspCode,
    }),
    "configuration.json");
  sendPostRequest("./api/v1/task/v2-user-upload", formData);
}

function submitStructureFile(structureFiles) {
  const formData = new FormData();
  addStructureFileToFormData(formData, structureFiles);
  formData.append(
    "input",
    asJsonBlob({
      "conservation": true,
      "chains": getUserChainArray(),
    }),
    "configuration.json");
  sendPostRequest("./api/v1/task/v2-user-upload", formData);
}

function submitStructureFileNoConservation(structureFiles) {
  const formData = new FormData();
  addStructureFileToFormData(formData, structureFiles);
  formData.append(
    "input",
    asJsonBlob({
      "conservation": false,
      "chains": getUserChainArray(),
    }),
    "configuration.json");
  sendPostRequest("./api/v1/task/v2-user-upload", formData);
}

function submitStructurePdbWithMsa(structurePdb, msaFiles) {
  const formData = new FormData();
  addMsaFilesToFormData(formData, msaFiles);
  formData.append(
    "input",
    asJsonBlob({
      "conservation": true,
      "pdb": structurePdb,
      "chains": getStructurePdbChain(),
    }),
    "configuration.json");
  sendPostRequest("./api/v1/task/v2-user-upload", formData);
}

function getStructurePdbChain() {
  const chains = [];
  $(".chain-checkbox").each(function () {
    const checkbox = $(this);
    if (checkbox.prop("checked")) {
      chains.push(checkbox.attr("chain"));
    }
  });
  return chains;
}

function submitStructurePdb(structurePdb) {
  const chains = getStructurePdbChain();
  window.location.href = createUrl(
    "v2-conservation", structurePdb.toUpperCase(), chains);
}

function createUrl(database, pdb, chains) {
  let result = "./analyze?database=" + database + "&code=" + pdb;
  if (chains.length > 0) {
    result += "_" + chains.join(",");
  }
  return result;
}

function submitStructurePdbNoConservation(structurePdb) {
  const chains = getStructurePdbChain();
  window.location.href = createUrl("v2", structurePdb.toUpperCase(), chains);
}

//
//
//

function doConservationClicked() {
  const pdbFiles = $("#upload-pdb").get(0).files;
  if ($("#conservation-checkbox").prop("checked")) {
    const pdbid_opt = (pdbFiles.length === 0);
    $("#pdbId_opt").prop("disabled", pdbid_opt);
    $("#upload-msas").prop("disabled", false);
    if (!pdbid_opt) {
      $("#pdbId_opt_lbl").removeClass("disabled");
    }
    $("#msa_opt_lbl").removeClass("disabled");
  } else {
    $("#pdbId_opt").prop("disabled", true);
    $("#upload-msas").prop("disabled", true);
    $("#pdbId_opt_lbl").addClass("disabled");
    $("#msa_opt_lbl").addClass("disabled");
  }
}

$(document).ready(function () {
  doConservationClicked();
  $(".tooltip-hint").tooltip();
  document.getElementById("pdbUploadSubmit").onclick = function () {
    uploadPdbFile();
  };
});

function updateChainSelector() {
  const pdbId = $("#pdbId").val().toLowerCase();
  const chainSelector = $("#chain-selector");
  if (!isValidPdbId(pdbId)) {
    chainSelector.hide();
    return;
  }
  const url = "https://www.ebi.ac.uk/pdbe/api/pdb/entry/molecules/" + pdbId;
  fetch(url).then(function (response) {
    if (response.status !== 200) {
      throw new Error("Invalid response.");
    }
    return response.json();
  }).then(function (response) {
    const chains = collectChainsFromPdbMoleculeResponse(response[pdbId]);
    const html = generateHtmlForChainSelectors(chains);
    chainSelector.html(html).show();
  }).catch(function (error) {
    console.warn("Can\"t fetch chains:", error);
    chainSelector.html("Can\"t fetch chains for given PDB ID.").show();
  });
}

function collectChainsFromPdbMoleculeResponse(entities) {
  const chains = new Set();
  entities.forEach(function (entity) {
    if (!entity["sequence"]) {
      return;
    }
    entity["in_chains"].forEach(function (chain) {
      chains.add(chain);
    });
  });
  return chains;
}

function generateHtmlForChainSelectors(chains) {
  const checkBoxTemplate =
    `<div class="checkbox col-sm-1"> <label>
      <input type="checkbox" 
        onclick="P2rankWeb.doConservationClicked()" 
        checked="checked" 
        style="margin-right: 4px;" chain="{name}" class="chain-checkbox">
      {name}
    </label>
    </div>
    `;
  let content = "";
  chains.forEach(function (chain) {
    // Version of replaceAll.
    content += checkBoxTemplate.split("{name}").join(chain);
  });
  return (
    `<div>
      <b>Restrict to chains</b>
    </div>
    <div>
      {content}
    </div>`
  ).replace("{content}", content);
}

// Export to global scope so we can call functions from HTML,
// alternative is to use webpack library option, but that can not be set
// per input basis.
window.P2rankWeb = {
  "doConservationClicked": doConservationClicked,
  "updateChainSelector": updateChainSelector,
};