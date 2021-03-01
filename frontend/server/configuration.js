// This configuration is used only in develop mode.
module.exports = {
  // Port used to run-develop instance.
  "port": 8075,
  // Use this to server data from files. Thus you can develop
  // frontend without the need to run another component.
  "task-runner-directory": "../../data/database",
  // Use the option bellow to proxy commands to task runner instance.
  // This allow you to run tasks or connect to existing instance (p2rank.cz)
  // of task runner.
  // "task-runner-service": "localhost:8020",
};
