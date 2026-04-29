const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"AlertaiQ" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log("📧 Email Sent");
  } catch (err) {
    console.error("Email Error:", err.message);
  }
};

module.exports = sendEmail;