const jwt = require("jsonwebtoken");

// middleware for verifying jwt
module.exports = function auth(req, res, next) {
	try {
		const token = req.cookies.election_auth;

		const verified = jwt.verify(token, "secret-hack-election");
		console.log({token, verified});
		req.id = verified;
		next();
	} catch (err) {
		req.flash("error", "Access Denied!");
		res.redirect("/voter/vote-election");
	}
};
