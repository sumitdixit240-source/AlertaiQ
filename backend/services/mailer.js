const nodemailer = require("nodemailer");

const sendEmailOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "AlertAIQ OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    console.log("Email OTP sent");
  } catch (err) {
    console.log("Email Error:", err.message);
  }
};

module.exports = { sendEmailOTP };
