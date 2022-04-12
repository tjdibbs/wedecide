const jwt = require("jsonwebtoken");

// middleware for verifying jwt
// @ts-check

module.exports = function auth(req, res, next) {
	const token = req.cookies.contest_auth;

	try {
		if (!token) throw Error;
		const verified = jwt.verify(token, "secret-hack-contest");
		req.id = verified;
		next();
	} catch (err) {
		req.flash("error", "Access Denied!");
		return res.status(400).redirect("/voter/contest-vote");
	}
};
