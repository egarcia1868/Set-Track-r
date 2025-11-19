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
    name: { type: String, default: "" },
    bio: { type: String, default: "" },
    isPublic: { type: Boolean, default: false },
    shareableId: { type: String, unique: true, sparse: true },
  },
  following: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      displayName: { type: String, required: true },
      followedAt: { type: Date, default: Date.now },
    },
  ],
  followers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      displayName: { type: String, required: true },
      followedAt: { type: Date, default: Date.now },
    },
  ],
  blockedUsers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      blockedAt: { type: Date, default: Date.now },
    },
  ],
});

// Create a sparse unique index on displayName to ensure uniqueness while allowing empty values
userSchema.index(
  { "profile.displayName": 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { "profile.displayName": { $ne: "" } },
  },
);

export default model("User", userSchema);
