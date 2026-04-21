const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify((err) => {
  if (err) {
    console.log("❌ Email error:", err.message);
  } else {
    console.log("✅ Email ready");
  }
});

// ================= SEND OTP EMAIL =================
const sendEmailOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"AlertAIQ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "AlertAIQ OTP Verification Code",
      html: `
        <div style="font-family:Arial;padding:20px">
          <h2>🔐 AlertAIQ OTP</h2>
          <p>Your OTP is:</p>
          <h1 style="color:#4f46e5">${otp}</h1>
          <p>Valid for 5 minutes only.</p>
        </div>
      `,
    });

    console.log("📩 OTP sent successfully to:", email);
  } catch (error) {
    console.log("❌ Email send failed:", error.message);
  }
};

module.exports = { sendEmailOTP };
