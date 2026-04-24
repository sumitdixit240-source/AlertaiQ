const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
      default: "User"
    },

    email: {
      type: String,
      required: true,
      unique: true, // single index source
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    isPro: {
      type: Boolean,
      default: false
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    tokenVersion: {
      type: Number,
      default: 0
    },

    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);


// ================= HASH PASSWORD =================
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (err) {
    next(err);
  }
});


// ================= COMPARE PASSWORD =================
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};


// ================= FORCE LOGOUT =================
userSchema.methods.incrementTokenVersion = async function () {
  this.tokenVersion += 1;
  await this.save();
};


module.exports = mongoose.model("User", userSchema);
