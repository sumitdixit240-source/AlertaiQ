const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async (to, subject, text) => {
  await transporter.sendMail({
    from: "AlertAIQ <alertaiq6@gmail.com>",
    to,
    subject,
    text
  });
};

module.exports = sendMail;