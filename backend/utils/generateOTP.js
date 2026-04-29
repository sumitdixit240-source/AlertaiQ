const crypto = require("crypto");

const generateOTP = (length = 6) => {
  if (length < 4 || length > 10) {
    throw new Error("OTP length must be between 4 and 10");
  }

  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);

  return crypto.randomInt(min, max).toString();
};

module.exports = generateOTP;
