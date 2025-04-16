import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true
    },
    password: {
      type: String,
      required: true,
      minLength: 6
    }
  },
  { timestamps: true }
);

export default model("User", userSchema);
