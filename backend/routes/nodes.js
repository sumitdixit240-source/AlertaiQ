const express = require("express");
const router = express.Router();

const Node = require("../models/Node");
const User = require("../models/User");
const auth = require("../middleware/auth");


// ================= GET USER NODES =================
router.get("/", auth, async (req, res) => {
  try {
    const nodes = await Node.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(nodes);
  } catch (err) {
    console.error("GET NODES ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
});


// ================= CREATE NODE =================
router.post("/", auth, async (req, res) => {
  try {
    const { cat, sub, freq, amt, expiry } = req.body;

    // ✅ VALIDATION
    if (!cat || !sub) {
      return res.status(400).json({ error: "Category and Subcategory required" });
    }

    // ✅ CHECK USER
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ FREE PLAN LIMIT (2 NODES MAX)
    const count = await Node.countDocuments({ userId: req.user.id });
    if (!user.isPro && count >= 2) {
      return res.status(403).json({ error: "Free limit reached (Max 2 nodes)" });
    }

    // ✅ CREATE NODE
    const node = await Node.create({
      userId: req.user.id,
      cat,
      sub,
      freq,
      amt,
      expiry
    });

    res.status(201).json(node);

  } catch (err) {
    console.error("CREATE NODE ERROR:", err.message);
    res.status(500).json({ error: "Failed to create node" });
  }
});


// ================= UPDATE NODE =================
router.put("/:id", auth, async (req, res) => {
  try {
    const node = await Node.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id   // 🔒 USER ISOLATION
      },
      req.body,
      { new: true }
    );

    if (!node) {
      return res.status(404).json({ error: "Node not found or unauthorized" });
    }

    res.json(node);

  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).json({ error: "Update failed" });
  }
});


// ================= DELETE NODE =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const node = await Node.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id   // 🔒 USER ISOLATION
    });

    if (!node) {
      return res.status(404).json({ error: "Node not found or unauthorized" });
    }

    res.json({ msg: "Deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});


module.exports = router;