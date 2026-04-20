const axios = require("axios");

exports.sendOTP = async (phone, otp) => {

  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: {
        body: `🔐 AlertaiQ OTP: ${otp}`
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WA_TOKEN}`
      }
    }
  );

};