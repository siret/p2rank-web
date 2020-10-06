const express = require("express");
const logger = require("./logging");
const request = require("request");

(function main() {
  const app = express();
  initializeApi(app);
  start(app);
})();

function initializeApi(app) {
  const ga = process.env.P2RANK_WEB_MONITOR_GOOGLE_ANALYTICS;
  if (ga === undefined) {
    logger.info("No Google Analytics account provided.")
  } else {
    app.use("/api/v1/view", createOnView(ga));
  }
}

function createOnView(ga) {
  const url = "https://www.google-analytics.com/collect?"
    + "v=1&t=event&tid=" + ga + "&cid=0&ec=pdbe-kb&ea=view"

  const options = {
    "url": url,
    "headers": {
      "User-Agent": "request",
    },
  };

  return (req, res) => {
    request(options, (error, response) => {
      if (error && response.statusCode !== 200) {
        logger.error("Can't report view.")
      }
    });
    // Do not wait for our request to finish.
    res.status(200);
    res.send();
  }
}

function start(app) {
  const port = 8021;
  app.listen(port, function onStart(error) {
    if (error) {
      logger.error("Can't start server.", {"error": error});
    }
    logger.info("Server has been started.", {"port": port});
  });
}
