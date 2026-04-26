const nodemailer = require("nodemailer");

// ================= TRANSPORT =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

// ================= VERIFY CONNECTION =================
transporter.verify()
  .then(() => console.log("✅ Core.AI Mailer Ready"))
  .catch((err) => console.log("❌ Mailer Error:", err.message));

// ================= CORE MAIL FUNCTION =================
const sendMail = async ({ to, subject, html }) => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters");
    }

    const info = await transporter.sendMail({
      from: `"Core.AI Alerts ⚡" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📩 Mail Sent → ${to} | ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (err) {
    console.error("❌ Mail Send Failed:", err.message);

    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = sendMail;