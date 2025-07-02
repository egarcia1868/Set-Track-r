import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
  },
  attendedConcerts: [
    {
      type: Schema.Types.ObjectId,
      ref: "UserConcerts",
    },
  ],
});

export default model("User", userSchema);
