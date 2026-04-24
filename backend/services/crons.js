const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendMail = require("./mailer");

// ================= INTERVAL MAPPING =================
const getIntervalMs = (freq) => {
  switch (freq) {
    case "daily": return 24 * 60 * 60 * 1000;
    case "weekly": return 7 * 24 * 60 * 60 * 1000;
    case "monthly": return 30 * 24 * 60 * 60 * 1000;
    case "one-time": return null;
    default: return null;
  }
};

// ================= CRON JOB =================
// Runs every minute
cron.schedule("* * * * *", async () => {
  console.log("⏱ Cron running...");

  const now = Date.now();

  try {
    const alerts = await Alert.find({});

    for (const a of alerts) {
      try {
        if (!a.expiryDate) continue;

        const expiryTime = new Date(a.expiryDate).getTime();
        if (isNaN(expiryTime)) continue;

        const diff = expiryTime - now;

        // ❌ already expired
        if (diff <= 0) continue;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

        // ================= ONE-TIME ALERT =================
        if (a.frequency === "one-time") {
          const threeDays = 3 * 24 * 60 * 60 * 1000;

          if (diff <= threeDays && !a.reminderSent) {
            await sendMail(
              a.email,
              "⚠️ Renewal Reminder",
              `
                <h2>${a.title} Expiring Soon</h2>
                <p><b>Category:</b> ${a.category}</p>
                <p><b>Amount:</b> ₹${a.amount}</p>
                <p><b>Expiry:</b> ${new Date(expiryTime).toLocaleString()}</p>
                <h3>⏳ Time Left: ${days}d ${hours}h</h3>
              `
            );

            a.reminderSent = true;
            a.lastSent = new Date();
            await a.save();

            console.log(`📩 One-time reminder sent → ${a.email}`);
          }

          continue;
        }

        // ================= RECURRING ALERT =================
        const interval = getIntervalMs(a.frequency);
        if (!interval) continue;

        const lastSentTime = a.lastSent
          ? new Date(a.lastSent).getTime()
          : 0;

        if (now - lastSentTime >= interval) {
          await sendMail(
            a.email,
            "⏳ Renewal Alert",
            `
              <h2>${a.title}</h2>
              <p><b>Category:</b> ${a.category}</p>
              <p><b>Amount:</b> ₹${a.amount}</p>
              <p><b>Frequency:</b> ${a.frequency}</p>
              <p><b>Expiry:</b> ${new Date(expiryTime).toLocaleString()}</p>
              <h3>⏰ Time Left: ${days}d ${hours}h</h3>
            `
          );

          a.lastSent = new Date();
          await a.save();

          console.log(`📩 Recurring alert sent → ${a.email}`);
        }

      } catch (innerErr) {
        console.error("⚠️ Alert processing error:", innerErr.message);
      }
    }

  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }
});
