<%@page contentType="text/html" pageEncoding="UTF-8" %>
<%@taglib prefix="t" tagdir="/WEB-INF/tags" %>

<t:layout>
    <jsp:attribute name="header_before">
            <script src="${pageContext.request.contextPath}/javascripts/LiteMol-plugin.js"></script>
            <link rel="stylesheet"
                  href="${pageContext.request.contextPath}/css/LiteMol-plugin.css"/>
    </jsp:attribute>
    <jsp:attribute name="header_after">
            <link rel="stylesheet" href="http://code.jquery.com/ui/1.11.0/themes/smoothness/jquery-ui.css">
            <%--jQuery already included in the layout page (needed for bootstrap)--%>
            <script type="text/javascript" src="http://code.jquery.com/ui/1.11.0/jquery-ui.min.js"></script>
            <script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/snap.svg/0.5.1/snap.svg-min.js"></script>
            <link rel="stylesheet" href="${pageContext.request.contextPath}/css/protael.css"/>
            <%--<script src="${pageContext.request.contextPath}/javascripts/protael.1.1.0.min.js"></script>--%>
            <script src="${pageContext.request.contextPath}/javascripts/protael.js"></script>
            <script type="text/javascript" async="" src="${pageContext.request.contextPath}/javascripts/FileSaver_Blob.js"></script>
            <link rel="stylesheet"
                  href="${pageContext.request.contextPath}/css/visualizations.css"/>
    </jsp:attribute>
    
    <jsp:body>
        <div id="sequence-view" class="sequence-view"/>
        <div id="app" class="app col-xs-12 col-md-10" data-input-type="${inputType}" data-input-id="${inputId}"></div>
        <div id="pocket-list" class="pocket-list col-xs-12 col-md-2"/>
        <script>
            var createProtael = function(content, el, showControls) {
                // create Protael instance
                return Protael(content, el, showControls);
            };
        </script>
        <script src="${pageContext.request.contextPath}/javascripts/LiteMol-PrankWeb.js"></script>
    </jsp:body>
</t:layout>
