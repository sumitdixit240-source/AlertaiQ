const nodemailer = require("nodemailer");

// ================= VALIDATE ENV =================
if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL credentials missing in environment variables");
}

// ================= TRANSPORTER (ROBUST + GMAIL SAFE) =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,              // STARTTLS (best for Render/Cloud/VPS)
  secure: false,          // must be false for port 587

  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },

  connectionTimeout: 15000,
  socketTimeout: 15000,
});

// ================= VERIFY SMTP =================
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mail Server Error:", error.message);
  } else {
    console.log("📧 Mail Server Ready - SMTP Connected");
  }
});

// ================= SEND EMAIL FUNCTION =================
const sendMail = async (to, subject, html) => {
  try {
    // basic validation
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters");
    }

    const info = await transporter.sendMail({
      from: `"AlertAIQ ⚡" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email Sent Successfully:", info.messageId);
    return true;

  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return false;
  }
};

module.exports = sendMail;
