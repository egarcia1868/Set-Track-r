import mongoose from "mongoose";

const { Schema, model } = mongoose;

const concertSchema = new Schema(
  {
    apiId: { type: String, unique: true },
    eventDate: { type: String, required: true },
    artist: {
      type: {
        name: { type: String, required: true },
        sortName: { type: String },
        disambiguation: { type: String },
        url: { type: String },
      },
      required: true,
    },
    venue: {
      type: {
        name: { type: String },
        city: {
          type: {
            name: { type: String, required: true },
            state: { type: String, required: true },
            stateCode: { type: String, required: true },
            coords: {
              type: {
                lat: { type: Number },
                long: { type: Number },
              },
            },
            country: {
              type: { code: String, name: String },
              required: true,
            },
          },
        },
        url: { type: String },
      },
      required: true,
    },
    sets: {
      type: [
        {
          name: { type: String },
          encore: { type: String },
          songs: {
            type: [
              {
                name: { type: String, required: true },
                info: { type: String },
              },
            ],
          },
        },
      ],
    },
    url: { type: String },
  },
  { timestamps: true }
);

export default model("Concert", concertSchema);
