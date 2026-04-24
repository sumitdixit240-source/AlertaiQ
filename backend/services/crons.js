const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendMail = require("./mailer");

// ================= INTERVAL MAPPING =================
const getIntervalMs = (freq) => {
  switch (freq) {
    case "daily":
      return 24 * 60 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "monthly":
      return 30 * 24 * 60 * 60 * 1000;
    case "one-time":
      return null;
    default:
      return null;
  }
};

// ================= CRON JOB =================
// Runs every minute
cron.schedule("* * * * *", async () => {
  console.log("⏱ Cron running...");

  const now = Date.now();

  try {
    const alerts = await Alert.find({});

    for (const alert of alerts) {
      try {
        if (!alert.expiryDate) continue;

        const expiryTime = new Date(alert.expiryDate).getTime();
        if (Number.isNaN(expiryTime)) continue;

        const diff = expiryTime - now;

        // ❌ already expired
        if (diff <= 0) continue;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

        // ================= ONE-TIME ALERT =================
        if (alert.frequency === "one-time") {
          const threshold = 3 * 24 * 60 * 60 * 1000;

          if (diff <= threshold && !alert.reminderSent) {
            await sendMail(
              alert.email,
              "⚠️ Renewal Reminder",
              `
                <h2>${alert.title} Expiring Soon</h2>
                <p><b>Category:</b> ${alert.category}</p>
                <p><b>Amount:</b> ₹${alert.amount}</p>
                <p><b>Expiry:</b> ${new Date(expiryTime).toLocaleString()}</p>
                <h3>⏳ Time Left: ${days}d ${hours}h</h3>
              `
            );

            alert.reminderSent = true;
            alert.lastSent = new Date();
            await alert.save();

            console.log(`📩 One-time reminder sent → ${alert.email}`);
          }

          continue;
        }

        // ================= RECURRING ALERT =================
        const interval = getIntervalMs(alert.frequency);
        if (!interval) continue;

        const lastSentTime = alert.lastSent
          ? new Date(alert.lastSent).getTime()
          : 0;

        if (now - lastSentTime >= interval) {
          await sendMail(
            alert.email,
            "⏳ Renewal Alert",
            `
              <h2>${alert.title}</h2>
              <p><b>Category:</b> ${alert.category}</p>
              <p><b>Amount:</b> ₹${alert.amount}</p>
              <p><b>Frequency:</b> ${alert.frequency}</p>
              <p><b>Expiry:</b> ${new Date(expiryTime).toLocaleString()}</p>
              <h3>⏰ Time Left: ${days}d ${hours}h</h3>
            `
          );

          alert.lastSent = new Date();
          await alert.save();

          console.log(`📩 Recurring alert sent → ${alert.email}`);
        }

      } catch (err) {
        console.error("⚠️ Alert processing error:", err.message);
      }
    }

  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }
});
