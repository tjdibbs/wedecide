const route = require("express").Router();
const jwt = require("jsonwebtoken");

route.get("/", (req, res, next) => {
	const error = req.flash("error")[0];
	const formData = req.flash("formData")[0];
	const success = req.flash("success")[0];

	console.log({error, formData, success});

	res.render("admin_login", {error, formData, success});
});

module.exports = route;
