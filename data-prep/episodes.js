const mongoose = require("mongoose");
const axios = require("axios");
const Episode = require("../models/Episode");
const config = require("../config/database");

// MongoDB connection
mongoose
    .connect(config.url)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("Connection error:", err));

const db = mongoose.connection;

// Extracting ID from URL fields
const extractId = (url) => {
    if (!url) return 0;
    // Splitting URL by "/" and get the last part as ID
    const urlParts = url.split("/");
    return Number(urlParts[urlParts.length - 1]);
};

const prepareDataset = async () => {
    try {
        console.log("Starting episode data preparation...");
        // Delete existing data
        await Episode.deleteMany({});

        let allEpisodes = [];
        let apiUrl = "https://rickandmortyapi.com/api/episode";

        // Running through all pages
        while (apiUrl) {
            // Fetching data from API page by page. Used axios for fetching since it'll return JSON by default
            const response = await axios.get(apiUrl);
            const { results, info } = response.data;

            // Convert API data to match our Schema
            const formattedData = results.map((episode) => ({
                episodeId: episode.id,
                name: episode.name,
                air_date: episode.air_date,
                episode: episode.episode,
                characters: episode.characters.map((url) => extractId(url)),
                created: episode.created,
                updated: new Date(),
            }));

            allEpisodes = allEpisodes.concat(formattedData);
            apiUrl = info.next; // Next page URL
        }

        console.log(`Finished fetching! Total Episodes: ${allEpisodes.length}`);

        // Save to MongoDB
        await Episode.insertMany(allEpisodes);
        console.log("Success!!! Episode data preparation completed.");
    } catch (error) {
        console.error("Error!!!: ", error.message);
    } finally {
        await db.close();
        process.exit(0);
    }
};

prepareDataset();
