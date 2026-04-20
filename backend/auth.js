const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {sign} = require("../utils/jwt");

// REGISTER
router.post("/register", async (req,res)=>{
  const hash = await bcrypt.hash(req.body.password,10);

  await User.create({
    ...req.body,
    password:hash
  });

  res.json({message:"User created"});
});

// LOGIN
router.post("/login", async (req,res)=>{
  const user = await User.findOne({email:req.body.email});

  const ok = await bcrypt.compare(req.body.password,user.password);

  const token = sign(user._id);

  res.json({token});
});

module.exports = router;