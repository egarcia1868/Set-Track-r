import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
  },
  artistsSeenLive: [
    {
      artistName: { type: String, required: true },
      artistId: {
        type: String,
        required: true,
      },
      concerts: [String],
    },
  ],
});

export default model("User", userSchema);
