const express = require("express");
const route = express.Router();
const {AddUsers} = require("./user_control");
const Emailer = require("../mailer");

route.get("/", (req, res, next) => {
	res.render("admin_reg", {formData: null, error: null, success: null});
});

route.post("/", async (req, res) => {
	const formData = req.body;

	const {type, message} = await AddUsers(formData);

	switch (type) {
		case "error":
			res.status(301).render("admin_reg", {
				formData,
				error: message,
				success: null,
			});
			break;
		case "success":
			const text = `Good Day ${formData.name}! \nYou can now login and create your elections, Here are your login details \nUsername: ${formData.username} \nPassword: ${formData.password}`;
			Emailer(formData.email, text);

			req.flash("success", message);
			res.status(301).redirect("/login");
			break;

		default:
			break;
	}
});

module.exports = route;
