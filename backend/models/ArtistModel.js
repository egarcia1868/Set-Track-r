import mongoose from "mongoose";

const { Schema, model } = mongoose;

const artistSchema = new Schema(
  {
    artistName: { type: String },
    artistId: { type: String },
    concerts: {
      type: [],
      required: true,
    },
  },
  { timestamps: true }
);

export default model("Artist", artistSchema);
