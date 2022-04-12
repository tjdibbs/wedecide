const route = require("express").Router();
const jwt = require("jsonwebtoken");

route.get("/", (req, res, next) => {
	res.render("index", {});
});

module.exports = route;
