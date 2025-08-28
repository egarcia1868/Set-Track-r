import mongoose from "mongoose";

const { Schema, model } = mongoose;

const concertSchema = new Schema(
  {
    setlistFmId: {
      type: String,
      required: true,
      unique: true,
    },
    artistId: {
      type: String,
      required: true,
    },
    artistName: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    songs: [
      {
        type: String,
      },
    ],
    attendees: [
      {
        type: String, // Auth0 user IDs
      },
    ],
  },
  { timestamps: true },
);

export default model("Concert", concertSchema);
