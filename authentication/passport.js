const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const {CheckUsers} = require("../routes/user_control");
const jwt = require("jsonwebtoken");

passport.use(
	"localSignin",
	new LocalStrategy(
		{
			usernameField: "username",
			passwordField: "password",
		},
		async function (username, password, next) {
			// Find the user
			const formData = {username, password};
			const {user, message} = await CheckUsers(formData);

			try {
				console.info({user, message});
				if (!user) throw Error(message);

				return next(null, user);

				// return res.cookie("auth", token).redirect("/admin");
			} catch (error) {
				console.log({...error});
				return next(null, false, {
					message: error.message,
				});
			}
		}
	)
);

passport.serializeUser(function (user, next) {
	// Serialize the user in the session
	return next(null, user);
});

passport.deserializeUser(function (user, next) {
	// Use the previously serialized user
	const token = jwt.sign(
		{
			...user,
		},
		"secret-hack-admin"
	);
	return next(null, token);
});
