const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendMail = require("./mailer");

// ================= INTERVAL MAP =================
const getIntervalMs = (freq) => {
  const map = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    yearly: 365 * 24 * 60 * 60 * 1000,
  };
  return map[freq] || null;
};

// ================= CRON ENGINE =================
cron.schedule("* * * * *", async () => {
  console.log(`⏱ Core.AI Alert Engine: ${new Date().toISOString()}`);

  const now = Date.now();

  try {
    const alerts = await Alert.find(
      {},
      "email title category amount frequency expiryDate lastSent"
    );

    for (const alert of alerts) {
      try {
        if (!alert.expiryDate || !alert.email) continue;

        const expiryTime = new Date(alert.expiryDate).getTime();
        if (isNaN(expiryTime)) continue;

        const diff = expiryTime - now;

        // ❌ STOP after expiry
        if (diff <= 0) continue;

        const lastSentTime = alert.lastSent
          ? new Date(alert.lastSent).getTime()
          : 0;

        // ======================================================
        // 1. ONE-TIME MODE (24 HOURS BEFORE EXPIRY ONLY)
        // ======================================================
        if (alert.frequency === "one-time") {
          const oneDay = 24 * 60 * 60 * 1000;

          const shouldSend = diff <= oneDay && now - lastSentTime > oneDay;

          if (shouldSend) {
            await sendMail(
              alert.email,
              `⚠️ Core.AI Alert: ${alert.title}`,
              `
                <div style="font-family:Arial">
                  <h2>${alert.title}</h2>
                  <p><b>Category:</b> ${alert.category}</p>
                  <p><b>Amount:</b> ₹${alert.amount}</p>
                  <p><b>Expiry:</b> ${new Date(expiryTime).toLocaleString()}</p>
                  <h3>⏳ Expires in: ${Math.floor(diff / 86400000)}d</h3>
                </div>
              `
            );

            alert.lastSent = new Date();
            await alert.save();

            console.log(`📩 One-time alert → ${alert.email}`);
          }

          continue;
        }

        // ======================================================
        // 2. RECURRING MODE (DAILY/WEEKLY/MONTHLY/YEARLY)
        // ======================================================
        const interval = getIntervalMs(alert.frequency);
        if (!interval) continue;

        const shouldSend = now - lastSentTime >= interval;

        if (shouldSend) {
          await sendMail(
            alert.email,
            `⏳ Core.AI Renewal Alert - ${alert.title}`,
            `
              <div style="font-family:Arial">
                <h2>${alert.title}</h2>
                <p><b>Category:</b> ${alert.category}</p>
                <p><b>Amount:</b> ₹${alert.amount}</p>
                <p><b>Frequency:</b> ${alert.frequency}</p>
                <p><b>Expiry:</b> ${new Date(expiryTime).toLocaleString()}</p>
                <h3>⏳ Time Left: ${Math.floor(diff / 86400000)} days</h3>
              </div>
            `
          );

          alert.lastSent = new Date();
          await alert.save();

          console.log(`📩 Recurring alert → ${alert.email}`);
        }

      } catch (err) {
        console.error(`⚠️ Error alert ${alert._id}:`, err.message);
      }
    }

  } catch (err) {
    console.error("❌ Cron failed:", err.message);
  }
});