const nodemailer = require("nodemailer");

// ================= VALIDATE ENV =================
if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL credentials missing in environment variables");
}

// ================= TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL (recommended for Gmail SMTP)
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS, // MUST be Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
});

// ================= VERIFY CONNECTION =================
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mail Server Error:", error.message);
  } else {
    console.log("📧 Mail Server Ready");
  }
});

// ================= SEND EMAIL =================
const sendMail = async (to, subject, html) => {
  try {
    // validation
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters");
    }

    const info = await transporter.sendMail({
      from: `"AlertaiQ" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email Sent:", info.messageId);
    return true;

  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return false;
  }
};

module.exports = sendMail;
