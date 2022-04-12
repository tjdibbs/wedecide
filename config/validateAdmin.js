const jwt = require("jsonwebtoken");

// middleware for verifying jwt
function auth(req, res, next) {
	try {
		const user = req.user;

		if (!user) throw Error;

		return next();
	} catch (err) {
		console.error({...err});

		req.flash("error", "Access Denied!");
		return res.status(404).redirect("/login");
	}
}

module.exports = auth;
