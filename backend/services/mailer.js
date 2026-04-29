const nodemailer = require("nodemailer");

// ================= DEBUG ENV (SAFE CHECK) =================
const EMAIL = process.env.EMAIL;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL || !EMAIL_PASS) {
  console.error("❌ EMAIL credentials missing in environment variables");
  console.error("EMAIL:", EMAIL);
  console.error("EMAIL_PASS exists:", !!EMAIL_PASS);
}

// ================= TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ================= VERIFY SMTP =================
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mail Server Error:", error.message);
  } else {
    console.log("📧 Mail Server Ready");
  }
});

// ================= SEND EMAIL =================
const sendEmail = async (to, subject, html) => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters");
    }

    if (!EMAIL || !EMAIL_PASS) {
      throw new Error("Missing EMAIL config in environment variables");
    }

    const info = await transporter.sendMail({
      from: `"AlertaiQ" <${EMAIL}>`,
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

module.exports = sendEmail;
