const nodemailer = require("nodemailer");

// Setting Up For Mailling
const transporter = nodemailer.createTransport({
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
    console.log({ response });
    return response;
  } catch (error) {
    console.log({ error });
    return { error: error.message };
  }
}

module.exports = Emailer;
