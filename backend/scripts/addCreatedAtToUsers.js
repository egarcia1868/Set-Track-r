import mongoose from "mongoose";
import User from "../models/UserModel.js";
import dotenv from "dotenv";

dotenv.config();

async function addCreatedAtToExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update all users that don't have a createdAt field
    const result = await User.updateMany(
      { createdAt: { $exists: false } },
      { $set: { createdAt: new Date() } }
    );

    console.log(`Updated ${result.modifiedCount} users with createdAt timestamp`);

    // Close connection
    await mongoose.connection.close();
    console.log("Migration complete");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addCreatedAtToExistingUsers();
