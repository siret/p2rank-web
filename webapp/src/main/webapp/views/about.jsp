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
            <h2 id="about"> About </h2>
            <p>Proteins are fundamental building blocks of all living organisms. They perform their function by binding to other molecules. This project deals with interactions
                between proteins and small molecules (so called ligands) because most of the currently used drugs are small molecules.
                While there are several tools that can predict these interactions, they are almost none for their visualization. Thus, we built a new visualization website by combining several protein visualizers together. Since evolutionary homology correlates with binding sites, our web interface also displays homology for comparison. We developed several ways how to calculate homology, and used it to improve detection of protein-ligand binding sites.
                Here we present PrankWeb, a modern web application for structure and sequence visualization of a protein and its protein-ligand binding sites as well as evolutionary homology. We hope that it will provide a quick and convenient way for scientists to analyze proteins.
                <br/> <br/>
                P2rank is a member of the <a href="https://www.ebi.ac.uk/pdbe/pdbe-kb">PDBe-KB</a> consortium, providing predictions of ligand binding sites to the knowledgebase.
            </p>
            <h2 id="citing"> Citing </h2>
            <p> If you use P2Rank online service, please cite:
            <ul>
                <li>Lukáš Jendele and Radoslav Krivák and Petr Škoda and Marian Novotný and David Hoksza.
                    <a href="https://doi.org/10.1093/nar/gkz424">PrankWeb: a web server for ligand binding site prediction and visualization</a>.
                    Nucleic Acids Research. May 2019
                </li>
                <li>Radoslav Krivák and David Hoksza.
                    <a href="https://doi.org/10.1186/s13321-018-0285-8">P2Rank: machine learning based tool for rapid and accurate prediction of ligand binding sites from protein structure</a>.
                    Journal of Cheminformatics. Aug 2018
                </li>
            </ul>
            <h2> Feedback </h2>
            <p> We would be happy to hear about your use cases, experiences and ideas/feature requests.
                Please feel free to raise an issue on a <a href="https://github.com/rdk/p2rank/issues">P2Rank GitHub issue tracker</a> (predictions and p2rank related) or
                <a href="https://github.com/siret/p2rank-web/issues">P2RankWeb GitHub issue tracker</a> (webservice and websites related).
            </p>
            <h2 id="authors"> Team </h2>
            <div class="row pt-md">
                <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12 profile">
                    <div class="img-box">
                        <img src="/images/jendelel.jpg">
                    </div>
                    <h3>Lukas Jendele</h3>
                    <p>Faculty of Mathematics and Physics, Charles University</p>
                    <p>Department of Computer Science, ETH Zurich</p>
                    <p><span class="glyphicon glyphicon-envelope"></span> lukas.jendele (at)
                        gmail.com</p>
                </div>
                <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12 profile">
                    <div class="img-box">
                        <img src="/images/hokszad.jpg">
                    </div>
                    <h3>David Hoksza</h3>
                    <p>Faculty of Mathematics and Physics, Charles University</p>
                    <p>Luxembourg Centre for Systems Biomedicine, University of Luxembourg</p>
                    <p><span class="glyphicon glyphicon-envelope"></span> david.hoksza (at)
                        mff.cuni.cz </p>
                </div>
                <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12 profile">
                    <div class="img-box">
                        <img src="/images/krivakr.jpg">
                    </div>
                    <h3>Radoslav Krivák</h3>
                    <p>Faculty of Mathematics and Physics, Charles University</p>
                    <p><span class="glyphicon glyphicon-envelope"></span> rkrivak (at)
                        gmail.com </p>
                </div>
                <div class="clearfix visible-md-block visible-lg-block"></div>
                <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12 profile">
                    <div class="img-box">
                        <img src="/images/skodap.jpg">
                    </div>
                    <h3>Petr Škoda</h3>
                    <p>Faculty of Mathematics and Physics, Charles University</p>
                    <p><span class="glyphicon glyphicon-envelope"></span> skodapetr (at)
                        gmail.com </p>
                </div>
                <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12 profile">
                    <div class="img-box">
                        <img src="/images/novotnym.jpg">
                    </div>
                    <h3>Marian Novotný</h3>
                    <p>Faculty of Science, Charles University</p>
                    <p><span class="glyphicon glyphicon-envelope"></span> marian.novotny (at)
                        natur.cuni.cz </p>
                </div>
            </div>
        </div>
    </jsp:body>
</t:layout>
