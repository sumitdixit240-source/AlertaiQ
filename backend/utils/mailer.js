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

// Send OTP email function
const sendEmailOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"AlertAIQ" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code of Login to AlertaiQ is :  ",
    html: `
      <div style="font-family:Arial;padding:10px">
        <h2>AlertAIQ Verification OTP</h2>
        <h1 style="color:#4f46e5">${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      </div>
    `,
  });
};

module.exports = { sendEmailOTP };
