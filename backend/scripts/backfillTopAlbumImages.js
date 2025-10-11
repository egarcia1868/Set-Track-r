import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Artist from "../models/ArtistModel.js";
import { getArtistTopAlbums } from "../services/concertService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

// Delay function to avoid rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function backfillTopAlbumImages() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully\n");

    // Find all artists without topAlbumImage
    const artistsWithoutImage = await Artist.find({
      $or: [
        { topAlbumImage: { $exists: false } },
        { topAlbumImage: null },
        { topAlbumImage: "" },
      ],
    });

    console.log(`Found ${artistsWithoutImage.length} artists without top album images\n`);

    if (artistsWithoutImage.length === 0) {
      console.log("No artists to process. Exiting.");
      await mongoose.connection.close();
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let noImageCount = 0;

    // Process each artist
    for (let i = 0; i < artistsWithoutImage.length; i++) {
      const artist = artistsWithoutImage[i];
      const progress = `[${i + 1}/${artistsWithoutImage.length}]`;

      try {
        console.log(`${progress} Processing: ${artist.artistName}`);

        // Call Last.fm API
        const topAlbumsData = await getArtistTopAlbums(artist.artistName);

        if (
          topAlbumsData &&
          topAlbumsData.topalbums &&
          topAlbumsData.topalbums.album
        ) {
          const albums = topAlbumsData.topalbums.album;

          // Find the album with the highest playcount
          let topAlbum = null;
          let maxPlaycount = 0;

          for (const album of albums) {
            const playcount = parseInt(album.playcount || 0);
            if (playcount > maxPlaycount) {
              maxPlaycount = playcount;
              topAlbum = album;
            }
          }

          // Extract the extralarge image URL
          if (topAlbum && topAlbum.image && Array.isArray(topAlbum.image)) {
            const extralargeImage = topAlbum.image.find(
              (img) => img.size === "extralarge"
            );
            if (
              extralargeImage &&
              extralargeImage["#text"] &&
              extralargeImage["#text"].trim() !== ""
            ) {
              artist.topAlbumImage = extralargeImage["#text"];
              await artist.save();
              console.log(`${progress} ✓ Saved image for ${artist.artistName}`);
              successCount++;
            } else {
              console.log(
                `${progress} ⚠ No extralarge image found for ${artist.artistName}`
              );
              noImageCount++;
            }
          } else {
            console.log(`${progress} ⚠ No albums found for ${artist.artistName}`);
            noImageCount++;
          }
        } else {
          console.log(
            `${progress} ⚠ No album data returned for ${artist.artistName}`
          );
          noImageCount++;
        }

        // Add a small delay to avoid rate limiting (Last.fm allows ~5 requests per second)
        await delay(250);
      } catch (error) {
        console.error(
          `${progress} ✗ Error processing ${artist.artistName}:`,
          error.message
        );
        errorCount++;

        // Add a longer delay after an error
        await delay(1000);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("BACKFILL COMPLETE");
    console.log("=".repeat(50));
    console.log(`Total artists processed: ${artistsWithoutImage.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`No image available: ${noImageCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("=".repeat(50) + "\n");

    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Fatal error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
backfillTopAlbumImages();
