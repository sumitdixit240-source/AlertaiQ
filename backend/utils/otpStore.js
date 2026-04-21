const otpStore = new Map();

// Add OTP
otpStore.setOtp = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
};

// Verify OTP
otpStore.verifyOtp = (email, otp) => {
  const record = otpStore.get(email);

  if (!record) return { valid: false, message: "OTP not found" };

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: "OTP expired" };
  }

  if (record.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }

  otpStore.delete(email);
  return { valid: true };
};

module.exports = otpStore;
