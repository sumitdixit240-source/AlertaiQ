const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,        // your gmail
    pass: process.env.EMAIL_PASS    // APP PASSWORD (not normal password)
  }
});

// Verify connection (important for debugging)
transporter.verify((err, success) => {
  if (err) {
    console.log("❌ MAILER FAILED:", err.message);
  } else {
    console.log("✅ ALERTAIQ MAILER READY");
  }
});

module.exports = transporter;
