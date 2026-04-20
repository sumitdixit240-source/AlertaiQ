const otpMap = new Map();

function saveOTP(identifier, otp) {
  otpMap.set(identifier, {
    otp,
    expires: Date.now() + 5 * 60 * 1000
  });
}

function verifyOTP(identifier, userOTP) {
  const data = otpMap.get(identifier);

  if (!data) return false;
  if (Date.now() > data.expires) return false;

  return data.otp === userOTP;
}

module.exports = { saveOTP, verifyOTP };