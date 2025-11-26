const mongoose = require("mongoose");
const axios = require("axios");
const Character = require("../models/Character");
const config = require("../config/database");

// MongoDB connection
mongoose
  .connect(config.url)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error:", err));

const db = mongoose.connection;

// Exracting ID from URL fields
const extractId = (url) => {
  if (!url) return 0;
  // Splitting URL by "/"" and get the last part as ID
  const urlParts = url.split("/");
  return Number(urlParts[urlParts.length - 1]);
};

const prepareDataset = async () => {
  try {
    console.log("Starting data preparation...");
    // Delete existing data
    await Character.deleteMany({});

    let allCharacters = [];
    let apiUrl = "https://rickandmortyapi.com/api/character";

    // Running through all pages
    while (apiUrl) {
      // Fetching data from API page by page. Used axios for fetching since it'll return JSON by default
      const response = await axios.get(apiUrl);
      const { results, info } = response.data;

      // Convert API data to match our Schema
      const formattedData = results.map((character) => ({
        characterId: character.id,
        name: character.name,
        isAlive: character.status?.toUpperCase() === "ALIVE",
        species: character.species,
        type: character.type,
        gender: character.gender,
        location: {
          name: character.location.name,
          id: extractId(character.location.url),
        },
        origin: {
          name: character.origin.name,
          id: extractId(character.origin.url),
        },
        image: character.image,
        episode: character.episode.map((url) => extractId(url)),
        created: character.created,
        updated: new Date(),
      }));

      allCharacters = allCharacters.concat(formattedData);
      apiUrl = info.next; // Next page URL
    }

    console.log(`Finished fetching! Total Characters: ${allCharacters.length}`);

    // Save to MongoDB
    await Character.insertMany(allCharacters);
    console.log("Success!!! Data preparation completed.");
  } catch (error) {
    console.error("Error!!!: ", error.message);
  } finally {
    await db.close();
    process.exit(0);
  }
};

prepareDataset();
