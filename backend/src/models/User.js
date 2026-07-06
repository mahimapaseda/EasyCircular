const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null, unique: true, sparse: true },
  },
  { timestamps: true },
);

userSchema.pre("validate", function validateAuthMethod() {
  if (!this.passwordHash && !this.googleId) {
    this.invalidate(
      "passwordHash",
      "Account must have a password or linked Google account",
    );
  }
});

module.exports = mongoose.model("User", userSchema);
