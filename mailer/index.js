const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

// Setting Up For Mailling
var transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	port: 465,
	secure: "true",
	auth: {
		user: "wedecideinfo@gmail.com",
		pass: "Anu08101897603",
	},
});

/**
 *
 * @param {string} email
 * @param {string} text
 * @returns {Promise<{response: object} | {error: string}>}
 */
async function Emailer(email, text) {
	const mailOptions = {
		from: "wedecideinfo@gmail.com",
		to: email,
		subject: "WeDecide Login Details",
		text,
	};

	try {
		const response = await transporter.sendMail(mailOptions);
		console.log({response});
		return response;
	} catch (error) {
		console.error({...error});
		return {error: error.message};
	}
}

module.exports = Emailer;
