import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Artist from "../models/ArtistModel.js";
import { getArtistTopAlbums } from "../services/concertService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI;
const DELAY_MS = 250; // Rate limiting delay between API calls

async function backfillTopAlbumImages() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully");

    // Find all artists that don't have a topAlbumImage
    const artistsWithoutImages = await Artist.find({
      $or: [{ topAlbumImage: { $exists: false } }, { topAlbumImage: null }],
    });

    console.log(
      `Found ${artistsWithoutImages.length} artists without top album images`,
    );

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < artistsWithoutImages.length; i++) {
      const artist = artistsWithoutImages[i];
      console.log(
        `\n[${i + 1}/${artistsWithoutImages.length}] Processing: ${artist.artistName}`,
      );

      try {
        // Fetch top albums from Last.fm
        const topAlbumsData = await getArtistTopAlbums(artist.artistName);

        if (topAlbumsData && topAlbumsData.topalbums && topAlbumsData.topalbums.album) {
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
              (img) => img.size === "extralarge",
            );
            if (
              extralargeImage &&
              extralargeImage["#text"] &&
              extralargeImage["#text"].trim() !== ""
            ) {
              artist.topAlbumImage = extralargeImage["#text"];
              await artist.save();
              console.log(`  ✓ Saved image for ${artist.artistName}`);
              successCount++;
            } else {
              console.log(`  ⊘ No extralarge image found for ${artist.artistName}`);
              skippedCount++;
            }
          } else {
            console.log(`  ⊘ No albums found for ${artist.artistName}`);
            skippedCount++;
          }
        } else {
          console.log(`  ⊘ No album data returned for ${artist.artistName}`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${artist.artistName}:`, error.message);
        failureCount++;
      }

      // Rate limiting delay
      if (i < artistsWithoutImages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log("\n=== Backfill Summary ===");
    console.log(`Total artists processed: ${artistsWithoutImages.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Skipped (no image): ${skippedCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log("========================\n");
  } catch (error) {
    console.error("Fatal error during backfill:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

backfillTopAlbumImages();
