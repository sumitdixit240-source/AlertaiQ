const nodemailer = require("nodemailer");

// ================= VALIDATE ENV =================
if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL credentials missing in environment variables");
}

// ================= TRANSPORTER (GMAIL FIXED) =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS (better for Render + cloud servers)
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS, // Gmail App Password ONLY
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 30000, // increased for Render stability
  greetingTimeout: 30000,
  socketTimeout: 30000,
  pool: true, // important for production stability
  maxConnections: 1,
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
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters");
    }

    const info = await transporter.sendMail({
      from: `"AlertAIQ ⚡" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email Sent:", info.messageId);
    return true;

  } catch (err) {
    console.error("❌ Email Error:", err.message);

    // IMPORTANT: fail-safe logging for debugging Render
    if (err.code === "ETIMEDOUT") {
      console.error("⏳ SMTP Timeout - Render network restriction likely");
    }

    return false;
  }
};

module.exports = sendMail;
