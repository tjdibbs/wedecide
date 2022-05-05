const nodemailer = require("nodemailer");

// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Setting Up For Mailling
var transporter = nodemailer.createTransport({
  // service: "gmail",
  host: "mail.wedecide.com.ng",
  port: 465,
  secure: true,
  auth: {
    user: process.env.mail_user,
    pass: process.env.mail_password,
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
    from: "info@wedecide.com.ng",
    to: email,
    subject: "WeDecide Login Details",
    text,
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    return response;
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = Emailer;
