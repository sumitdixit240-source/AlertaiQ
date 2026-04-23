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
      default: "User" // ✅ fallback for old records
    },

    email: {
      type: String,
      required: true,
      unique: true, // index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    isVerified: {
      type: Boolean,
      default: false, // ✅ safe for old users
    },

    // ✅ NEW (won’t break anything)
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ✅ optional tracking
    lastLogin: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);


// ================= PASSWORD HASH =================
// ✅ Only hash when modified (prevents double hash)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// ================= PASSWORD COMPARE =================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model("User", userSchema);