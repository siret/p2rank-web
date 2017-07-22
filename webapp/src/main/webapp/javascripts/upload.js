function uploadPdbFile() {
    var files = $('#upload-pdb').get(0).files;
    var msaFiles = $('#upload-msas').get(0).files;

    if (files.length > 0) {
        $('.progress-bar').text('0%');
        $('.progress-bar').width('0%');

        var formData = new FormData();
        var doConservation = $('#conservation-checkbox').prop('checked');
        formData.append('conservation', doConservation);

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            formData.append('pdbFile', file, file.name);
        }

        if (doConservation) {
            var pdbId = $("#pdbId_opt").val();
            if (isValidPdbId(pdbId)) {
                formData.append('pdbId',pdbId);
            }
            for (i = 0; i < msaFiles.length; i++) {
                file = msaFiles[i];
                formData.append(file.name, file, file.name);
            }
        }

        $.ajax({
            url: '/analyze/file_upload',
            type: 'POST',
            contentType: false,
            data: formData,
            processData: false,
            success: function (data) {
                console.log('Upload successful!\n' + data);
                var newUrl;
                if (data.startsWith("/")) {
                    newUrl = data;
                } else if (data.length < 50) {
                    newUrl = '/analyze/upload/'.concat(data);
                } else {
                    document.write(data);
                    document.close();
                }
                window.location.assign(newUrl);
            },
            xhr: function () {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();

                // listen to the 'progress' event
                xhr.upload.addEventListener('progress', function (evt) {

                    if (evt.lengthComputable) {
                        // calculate the percentage of upload completed
                        var percentComplete = evt.loaded / evt.total;
                        percentComplete = parseInt(percentComplete * 100);

                        // update the Bootstrap progress bar with the new percentage
                        $('.progress-bar').text(percentComplete + '%');
                        $('.progress-bar').width(percentComplete + '%');
                        $('.progress').show();

                        // once the upload reaches 100%, set the progress bar text to done
                        if (percentComplete === 100) {
                            $('.progress-bar').html('Running analysis...');
                            $('.progress').hide();
                            $('.spinner').show();
                        }
                    }
                }, false);
                return xhr;
            }
        });
    } else {
        alert("Please select some files to upload.")
    }
}

function doConservationClicked() {
    if ($('#conservation-checkbox').prop('checked')) {
        $('#pdbId_opt').prop('disabled', false);
        $('#upload-msas').prop('disabled', false);
        $('#pdbId_opt_lbl').removeClass('disabled');
        $('#msa_opt_lbl').removeClass('disabled');
    } else {
        $('#pdbId_opt').prop('disabled', true);
        $('#upload-msas').prop('disabled', true);
        $('#pdbId_opt_lbl').addClass('disabled');
        $('#msa_opt_lbl').addClass('disabled');
    }
}

function isValidPdbId(pdbId) {
    return pdbId.length === 4 && /^[a-zA-Z0-9]*$/.test(pdbId);
}

function submitPdbId() {
    var pdbId = $('#pdbId').val();
    if (pdbId === "") {
        window.location.href = '/analyze/id/2src';
    } else if (isValidPdbId(pdbId)) {
        var hostName = window.location.hostname;
        window.location.href = '/analyze/id/' + pdbId;
    } else {
        alert("Invalid PDB code.")
    }
}

$(document).ready(function () {
   doConservationClicked();
    $("a.msa-hint").tooltip();
});