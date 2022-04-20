// const nodemailer = require("nodemailer");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Setting Up For Mailling
// var transporter = nodemailer.createTransport({
//   service: "gmail",
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: "true",
//   auth: {
//     user: "wedecideinfo@gmail.com",
//     pass: "Anu08101897603",
//   },
// });

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

  const msg = {
    to: email, // Change to your recipient
    from: "wedecideInfo@gmail.com", // Change to your verified sender
    subject: "Wedecide Login Details",
    text,
  };
  sgMail
    .send(msg)
    .then((response) => {
      return;
    })
    .catch((error) => {
      console.error(error);
    });
}

module.exports = Emailer;
