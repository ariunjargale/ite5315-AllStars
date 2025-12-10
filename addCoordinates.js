/**
 * Script: addCoordinates.js
 * Purpose: Assign random latitude/longitude values to all locations
 *          that do not currently have coordinates.
 *
 * This script is safe:
 *  - It only updates locations missing coordinates.
 *  - It does not overwrite existing coordinates.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Location = require("./models/Location");

// Generate random geographic coordinates
function generateRandomCoordinates() {
  return {
    lat: parseFloat((Math.random() * 180 - 90).toFixed(6)), // Range: -90 to 90
    lng: parseFloat((Math.random() * 360 - 180).toFixed(6)), // Range: -180 to 180
  };
}

async function addCoordinatesToLocations() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.\n");

    // Find all locations missing coordinates
    const locationsWithoutCoords = await Location.find({
      $or: [
        { coordinates: { $exists: false } },
        { "coordinates.lat": null },
        { "coordinates.lng": null },
        { "coordinates.lat": { $exists: false } },
        { "coordinates.lng": { $exists: false } },
      ],
    });

    console.log(
      `Found ${locationsWithoutCoords.length} locations missing coordinates.\n`
    );

    if (locationsWithoutCoords.length === 0) {
      console.log(
        "All locations already have coordinates. No updates required."
      );
      process.exit(0);
    }

    let updatedCount = 0;

    for (const location of locationsWithoutCoords) {
      const coords = generateRandomCoordinates();

      location.coordinates = {
        lat: coords.lat,
        lng: coords.lng,
      };

      await location.save();

      console.log(
        `Updated Location ID ${location.locationId}: (${coords.lat}, ${coords.lng})`
      );

      updatedCount++;
    }

    console.log(
      `\nProcess complete. ${updatedCount} locations were updated with coordinates.`
    );

    process.exit(0);
  } catch (error) {
    console.error("\nError occurred while updating coordinates:\n", error);
    process.exit(1);
  }
}

addCoordinatesToLocations();
