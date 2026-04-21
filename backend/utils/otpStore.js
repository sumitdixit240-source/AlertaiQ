const otpStore = new Map();

/**
 * structure:
 * email -> { otp, expiresAt }
 */

const setOTP = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
};

const getOTP = (email) => {
  return otpStore.get(email);
};

const deleteOTP = (email) => {
  otpStore.delete(email);
};

module.exports = {
  setOTP,
  getOTP,
  deleteOTP
};
