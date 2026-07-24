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
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    jobRole: {
      type: String,
      enum: {
        values: ["teacher", "principal", "education_administration", null],
        message: "{VALUE} is not a valid job role",
      },
      default: null,
    },
    district: { type: String, default: null, trim: true },
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
