const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY missing in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

// ================= SEND EMAIL (INSTANT OTP) =================
const sendMail = async (to, subject, html) => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters");
    }

    const response = await resend.emails.send({
      from: "AlertAIQ ⚡ <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("⚡ OTP Sent Instantly:", response.id);
    return true;

  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return false;
  }
};

module.exports = sendMail;
