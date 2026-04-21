const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendMail = require("./mailer");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  const alerts = await Alert.find({});

  alerts.forEach(async (a) => {
    const diff = new Date(a.expiry) - now;

    if (diff < 24 * 60 * 60 * 1000 && diff > 0) {
      await sendMail(
        "user@email.com",
        "Expiry Alert",
        `Your ${a.subCategory} is expiring soon`
      );
    }
  });
});