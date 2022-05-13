const log4js = require("log4js");

log4js.configure({
  appenders: { everything: { type: "file", filename: "logs.log" } },
  categories: { default: { appenders: ["everything"], level: "ALL" } },
});

const logger = log4js.getLogger();

module.exports = logger;
