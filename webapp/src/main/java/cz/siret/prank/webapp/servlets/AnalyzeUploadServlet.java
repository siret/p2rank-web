package cz.siret.prank.webapp.servlets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import cz.siret.prank.lib.utils.Utils;
import cz.siret.prank.webapp.utils.DataGetter;

@WebServlet(name = "AnalyzeUploadServlet", urlPatterns = "/analyze/upload/*")
public class AnalyzeUploadServlet extends HttpServlet {

    private final transient Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws
            ServletException, IOException {
        String urlSuffix = req.getPathInfo();
        if (urlSuffix != null && urlSuffix.charAt(0) == '/') {
            String inputId = urlSuffix.substring(1);

            DataGetter data = new DataGetter("upload", inputId);
            File pdbFile = data.pdbFile().toFile();
            if (!pdbFile.exists()) {
                // File has been already deleted during clean-up
                req.setAttribute("inputId", inputId);
                RequestDispatcher rd = getServletContext()
                        .getRequestDispatcher("/views/deleted.jsp");
                rd.forward(req, resp);
                return;
            }

            File csvFile = data.csvFile().toFile();
            if (!csvFile.exists()) {
                // The analysis has not completed yet!
                req.setAttribute("inputId", inputId);
                String progress = Utils.INSTANCE.convertStreamToString(
                        Utils.INSTANCE.readFile(data.statusFile().toFile()), true);
                if (progress.toLowerCase().contains("error")) {
                    req.setAttribute("msg", progress.replace("\n", "<br/>"));
                    RequestDispatcher rd = getServletContext()
                            .getRequestDispatcher("/error/error.jsp");
                    rd.forward(req, resp);
                    return;
                } else {
                    req.setAttribute("progress", progress.replace("\n", "<br/>"));
                    RequestDispatcher rd = getServletContext()
                            .getRequestDispatcher("/views/in_progress.jsp");
                    rd.forward(req, resp);
                    return;
                }
            }

            req.setAttribute("inputType", "upload");
            req.setAttribute("inputId", inputId);
            RequestDispatcher rd = getServletContext().getRequestDispatcher("/views/visualize.jsp");
            rd.forward(req, resp);
        } else {
            RequestDispatcher rd = getServletContext().getRequestDispatcher("/error/404.jsp");
            rd.forward(req, resp);
            return;
        }

    }
}
