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
  profile: {
    displayName: { type: String, default: "" },
    bio: { type: String, default: "" },
    isPublic: { type: Boolean, default: false },
    shareableId: { type: String, unique: true, sparse: true },
  },
});

// Create a sparse unique index on displayName to ensure uniqueness while allowing empty values
userSchema.index({ "profile.displayName": 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { "profile.displayName": { $ne: "" } }
});

export default model("User", userSchema);
