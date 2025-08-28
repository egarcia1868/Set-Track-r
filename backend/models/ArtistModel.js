import mongoose from "mongoose";

const { Schema, model } = mongoose;

const artistSchema = new Schema(
  {
    artistName: {
      type: String,
      required: true,
    },
    artistId: {
      type: String,
      required: true,
      unique: true,
    },
    concerts: {
      type: [],
      required: true,
      default: [],
    },
  },
  { timestamps: true },
);

export default model("Artist", artistSchema);
