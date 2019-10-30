<%@page contentType="text/html" pageEncoding="UTF-8" %>
<%@taglib prefix="t" tagdir="/WEB-INF/tags" %>

<t:layout>
    <jsp:attribute name="header_after">
        <style type="text/css">
            .inline-image {
                height: 1em;
            }

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

            .container {
                background-color: transparent;
            }

            body{
                background-color: transparent;
                /*position: relative;*/
            }
        </style>
    </jsp:attribute>
    <jsp:body>
        <div class="container">
            <h2 id="p2rank"> Underlying method </h2>
            <p>PrankWeb is web interface based on P2Rank standalone method. For batch-processing, it is recommended to download standalone version (<a href="http://siret.ms.mff.cuni.cz/p2rank" target="_blank">link</a>) of P2Rank and run experiments locally.
            </p>
            <h2 id="data"> Data </h2>
            <p>PrankWeb classification model has been trained and validated on publicly available
                datasets. They are available at
                <a href="https://github.com/rdk/p2rank-datasets" target="_blank">https://github.com/rdk/p2rank-datasets</a>.
                The conservation pipeline uses <a href="http://swift.cmbi.ru.nl/gv/hssp/" target="_blank">HSSP database</a> as
                well as <a href="http://www.uniprot.org/downloads" target="_blank">SwissProt</a> and
                <a href="http://www.uniprot.org/downloads" target="_blank">TrEMBL</a> databases.
            </p>
            <h2 id="projects">Projects</h2>
            <p>PrankWeb wouldn't exist if not for these projects.</p>
            <div class="row pt-md">
                <div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 profile">
                    <h4>PrankWeb</h4>
                    <ul>
                        <li><a href="http://prankweb.cz">Project website</a></li>
                        <li><a href="https://github.com/siret/p2rank-web" target="_blank">GitHub </a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 profile">
                    <h4>P2Rank</h4>
                    <ul>
                        <li><a href="https://jcheminf.biomedcentral.com/articles/10.1186/s13321-018-0285-8" target="_blank">
                            Publication</a></li>
                        <li><a href="http://siret.ms.mff.cuni.cz/p2rank" target="_blank">Project website</a></li>
                        <li><a href="https://github.com/siret/p2rank" target="_blank">GitHub</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 profile">
                    <h4>LiteMol</h4>
                    <ul>
                    <li><a href="https://rdcu.be/z0Hf" target="_blank">Publication</a></li>
                    <li><a href="https://webchemdev.ncbr.muni.cz/LiteMol/" target="_blank">Project
                        website</a></li>
                    <li><a href="https://github.com/dsehnal/LiteMol" target="_blank">GitHub</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 profile">
                    <h4>Protael</h4>
                    <ul>
                    <li><a href="https://academic.oup.com/bioinformatics/article/32/4/602/1743824"
                          target="_blank">Publication</a></li>
                    <li><a href="http://protael.org" target="_blank">Project website</a></li>
                    <li><a href="https://github.com/sanshu/protaeljs" target="_blank">GitHub</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 profile">
                    <h4>JSD method</h4>
                    <ul>
                    <li><a
                            href="https://academic.oup.com/bioinformatics/article/23/15/1875/203579" target="_blank">Publication</a></li>
                    <li><a href="http://compbio.cs.princeton.edu/conservation/" target="_blank">Project website</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 profile">
                    <h4>MUSCLE</h4>
                    <ul>
                    <li><a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC390337/" target="_blank">Publication</a></li>
                    <li><a href="https://www.ebi.ac.uk/Tools/msa/muscle/" target="_blank">Project website</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 profile">
                    <h4>CD-HIT</h4>
                    <ul>
                    <li><a href="http://weizhong-lab.ucsd.edu/cd-hit/ref.php" target="_blank"> Publications</a></li>
                        <li><a href="http://weizhong-lab.ucsd.edu/cd-hit/download.php" target="_blank">Project website</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-3 col-sm-4 col-xs-12 profile">
                    <h4>PSI-BLAST</h4>
                    <ul>
                    <li><a href="https://www.ncbi.nlm.nih.gov/pubmed/20003500?dopt=Citation" target="_blank">Publication</a></li>
                    <li><a
                            href="https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE_TYPE=BlastDocs&DOC_TYPE=Download" target="_blank">Project website</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </jsp:body>
</t:layout>
