const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendEmail = require("./mailer");

// runs every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();

  const alerts = await Alert.find();

  alerts.forEach(async (a) => {
    const diff = a.expiryDate - now;

    let shouldSend = false;

    if (a.frequency === "Hourly") shouldSend = true;
    if (a.frequency === "Daily" && diff < 86400000) shouldSend = true;
    if (a.frequency === "Weekly" && diff < 604800000) shouldSend = true;
    if (a.frequency === "Monthly" && diff < 2592000000) shouldSend = true;

    if (shouldSend) {
      await sendEmail(
        a.email,
        "AlertaiQ Reminder",
        `
        <h2>Service Alert</h2>
        <p>Your service <b>${a.nodeName}</b> is nearing expiry.</p>
        <p>Expiry Date: ${a.expiryDate}</p>
        `
      );
    }
  });
});