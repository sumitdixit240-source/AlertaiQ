const router = require("express").Router();
const Alert = require("../models/Alert");
const auth = require("../middleware/auth");

// CREATE ALERT
router.post("/", auth, async (req, res) => {
  const alert = await Alert.create({
    userId: req.user.id,
    title: req.body.title,
    amount: req.body.amount,
    expiry: req.body.expiry
  });

  res.json(alert);
});

// GET ALERTS
router.get("/", auth, async (req, res) => {
  const alerts = await Alert.find({ userId: req.user.id });
  res.json(alerts);
});

module.exports = router;
