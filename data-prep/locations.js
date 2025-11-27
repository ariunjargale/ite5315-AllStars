const mongoose = require("mongoose");
const axios = require("axios");
const Location = require("../models/Location");
const config = require("../config/database");

// MongoDB connection
mongoose
  .connect(config.url)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error:", err));

const db = mongoose.connection;

// Extract ID from API URLs
const extractId = (url) => {
  if (!url) return 0;
  const urlParts = url.split("/");
  return Number(urlParts[urlParts.length - 1]);
};

const prepareDataset = async () => {
  try {
    console.log("Starting location data preparation...");

    // Delete existing data
    await Location.deleteMany({});

    let allLocations = [];
    let apiUrl = "https://rickandmortyapi.com/api/location";

    // Fetch all pages
    while (apiUrl) {
      const response = await axios.get(apiUrl);
      const { results, info } = response.data;

      // Convert API data to match schema
      const formattedData = results.map((loc) => ({
        locationId: loc.id,
        name: loc.name,
        type: loc.type,
        dimension: loc.dimension,
        residents: loc.residents.map((url) => extractId(url)),
        created: loc.created,
        updated: new Date(),
      }));

      allLocations = allLocations.concat(formattedData);
      apiUrl = info.next;
    }

    console.log(`Finished fetching! Total Locations: ${allLocations.length}`);

    // Save to MongoDB
    await Location.insertMany(allLocations);
    console.log("Success!!! Location data preparation completed.");
  } catch (error) {
    console.error("Error!!!: ", error.message);
  } finally {
    await db.close();
    process.exit(0);
  }
};

prepareDataset();
