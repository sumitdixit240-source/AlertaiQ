const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendMail = require("./mailer");

// ⏱ Convert frequency to milliseconds
const getIntervalMs = (freq) => {
  switch (freq) {
    case "1h": return 60 * 60 * 1000;
    case "6h": return 6 * 60 * 60 * 1000;
    case "12h": return 12 * 60 * 60 * 1000;
    case "24h": return 24 * 60 * 60 * 1000;
    case "Week": return 7 * 24 * 60 * 60 * 1000;
    case "Month": return 30 * 24 * 60 * 60 * 1000;
    case "Year": return 365 * 24 * 60 * 60 * 1000;
    default: return null;
  }
};

cron.schedule("* * * * *", async () => {
  const now = new Date();

  try {
    const alerts = await Alert.find({});

    for (let a of alerts) {
      const expiry = new Date(a.expiry);
      const diff = expiry - now;

      // ❌ Skip expired
      if (diff <= 0) continue;

      // ⏰ Calculate time left
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

      // =========================
      // 🎯 CASE 1: "3 days before"
      // =========================
      if (a.freq === "Once (3d Before)") {
        if (diff <= 3 * 24 * 60 * 60 * 1000 && !a.reminderSent) {
          await sendMail(
            a.email,
            "⚠️ Renewal Reminder",
            `
              <h2>${a.subCategory} Expiring Soon</h2>
              <p><b>Category:</b> ${a.category}</p>
              <p><b>Amount:</b> ₹${a.amount}</p>
              <p><b>Expiry:</b> ${expiry}</p>
              <hr/>
              <h3>⏳ Time Left: ${days}d ${hours}h</h3>
              <p>Please renew before expiry.</p>
            `
          );

          a.reminderSent = true;
          await a.save();
          console.log("📩 3-day reminder sent:", a.subCategory);
        }
        continue;
      }

      // =========================
      // 🎯 CASE 2: Regular frequency
      // =========================
      const interval = getIntervalMs(a.freq);
      if (!interval) continue;

      // First time OR interval passed
      if (!a.lastSent || (now - new Date(a.lastSent)) >= interval) {

        await sendMail(
          a.email,
          "⏳ Renewal Alert",
          `
            <h2>${a.subCategory}</h2>
            <p><b>Category:</b> ${a.category}</p>
            <p><b>Amount:</b> ₹${a.amount}</p>
            <p><b>Frequency:</b> ${a.freq}</p>
            <p><b>Expiry:</b> ${expiry}</p>
            <hr/>
            <h3>⏰ Time Left: ${days}d ${hours}h</h3>
          `
        );

        a.lastSent = now;
        await a.save();

        console.log("📩 Frequency mail sent:", a.subCategory);
      }
    }

  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});
