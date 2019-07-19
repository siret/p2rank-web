<%@page contentType="text/html" pageEncoding="UTF-8" %>
<%@taglib prefix="t" tagdir="/WEB-INF/tags" %>

<t:layout>
    <jsp:attribute name="header_after">
        <link rel="stylesheet"
              href="http://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.min.css"/>
        <link rel="stylesheet"
              href="${pageContext.request.contextPath}/css/home.css"/>

        <style type="text/css">
            body::after {
                background-image: url(/images/proteins.png);
                opacity: 0.1;
                top:0;
                bottom:0;
                left: 0;
                right: 0;
                display: block;
                content: "";
                width: 100%;
                height: 100%;
                background-size: cover;
                background-attachment: fixed;
                position: absolute;
                z-index: -1;
            }

            body{
                background-color: transparent;
                position: relative;
            }
        </style>
    </jsp:attribute>
    <jsp:body>
<div class="container jumbotron" style="padding-top: 0px">
    <h2 class="text-center">PrankWeb: Ligand Binding Site Prediction and Conservation Exploration</h2>
    <div style="padding-bottom: 10px; width: 75%; margin-left: 12%;">
        P2Rank is a novel machine learning-based method for prediction of
        ligand binding sites from protein structure.
    </div>
    <div style="display: none;" class="progress">
        <div role="progressbar" class="progress-bar"></div>
    </div>
    <div style="text-align: center; display: none;" class="spinner"><i
            style="font-size:48px; color: aqua;"
            class="fa fa-spinner fa-spin"></i><br/><span>Running analysis...</span>
    </div>
    <form class="form-horizontal" onsubmit="event.preventDefault(); return false;">
        <div class="panel panel-success" style="width:75%; margin-left:12%">
            <div class="panel-heading">Please upload your pdb protein file or enter PBD ID.</div>
            <div class="panel-body">
                <div class="form-group">
                    <label for="pdbId" class="col-sm-2 control-label">
                    PDB code
                        <a class='tooltip-hint' data-toggle="tooltip" data-placement="top" data-container="body"
                            title="PrankWeb will download the protein file from PDB.">
                            <i class='glyphicon glyphicon-question-sign' style="color:black;"></i>
                        </a>
                    </label>
                    <div class="col-sm-10" style="padding-bottom:10px">
                        <input type="text" id="pdbId" placeholder="2SRC" class="form-control"
                            oninput="doConservationClicked()" onkeyup="updateChainSelector()"/>
                    </div>
                    <div id="chain-selector" class="col-sm-10 col-sm-offset-2"></div>
                </div>
                <div style="text-align:center;">OR</div>
                <div class="form-group">
                    <label for="upload-pdb" class="col-sm-2 control-label">PDB file
                        <a class='tooltip-hint' data-toggle="tooltip" data-placement="top" data-container="body"
                           title="Upload your own PDB file (e.g. a PDB file of a biologically relevant unit.)">
                            <i class='glyphicon glyphicon-question-sign' style="color:black;"></i>
                        </a>
                    </label>
                    <div class="col-sm-10">
                        <input id="upload-pdb" name="pdbFile" accept=".pdb" type="file"
                            oninput="doConservationClicked()"/>
                    </div>
                    <div class="col-sm-10 col-sm-offset-2">
                        <div>
                            <b>Restrict to chains</b>
                                <a class="tooltip-hint" data-toggle="tooltip" data-placement="top" data-container="body"
                                    title="Optional. Comma separated list of chains to analyze.">
                                    <i class="glyphicon glyphicon-question-sign" style="color:black;"></i>
                                </a>
                        </div>
                        <div>
                            <input type="text" id="fileChains" placeholder="A,B" class="form-control">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="panel panel-success" style="width:75%; margin-left:12%">
            <div class="panel-heading">Conservation analysis</div>
            <div class="panel-body">
                <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <div class="checkbox">
                            <label>
                                <input id="conservation-checkbox" name="doConservation" type="checkbox"
                                    onclick="doConservationClicked()" checked="checked" style="margin-right: 4px;">
                                    Run conservation analysis
                                    <a class='tooltip-hint' data-toggle="tooltip" data-placement="top" data-container="body"
                                        title="If checked, a model that exploits conservation will be used to classify protein binding sites. If neither MSA nor PDB code is provided, PrankWeb will calculate conservation from MSA of similar proteins.">
                                        <i class='glyphicon glyphicon-question-sign' style="color:black;"></i>
                                    </a>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label id="pdbId_opt_lbl" for="pdbId_opt" class="col-sm-2 control-label">
                        PDB code (optional)
                        <a class='tooltip-hint' data-toggle="tooltip" data-placement="top" data-container="body"
                           title="If PDB code of the uploaded protein is provided, MSA alignment from HSSP database for this protein will be used to calculate the conservation score.">
                            <i class='glyphicon glyphicon-question-sign' style="color:black;"></i>
                        </a>
                    </label>
                    <div class="col-sm-10">
                        <input type="text" id="pdbId_opt" class="form-control"/>
                    </div>
                </div>
                <div class="form-group">
                    <label for="upload-msas" id="msa_opt_lbl" class="col-sm-2 control-label">
                        MSA files (optional)
                        <a class='tooltip-hint' data-toggle="tooltip" data-placement="top" data-container="body"
                            title="Provide your custom MSA file and PrankWeb will calculate the conservation scores from that MSA file. Alignments in FASTA formats are supported.">
                            <i class='glyphicon glyphicon-question-sign' style="color:black;"></i>
                        </a>
                    </label>
                    <div class="col-sm-10">
                        <input id="upload-msas" name="msaFiles" type="file" accept=".fasta, .aln" multiple/>
                    </div>
                </div>
            </div>
        </div>
    <div class="form-group">
        <div class="col-sm-offset-9 col-sm-2">
            <button id="pdbUploadSumbit" class="btn btn-default">Submit</button>
        </div>
    </div>

</form>
</div>
<script src="${pageContext.request.contextPath}/javascripts/upload.js"></script>
    </jsp:body>
</t:layout>
