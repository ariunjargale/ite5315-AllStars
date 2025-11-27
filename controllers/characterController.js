const Character = require("../models/Character");
const { validationResult } = require("express-validator");

// Get all characters
exports.getAllCharacters = async (req, res) => {
  try {
    const totalCharacters = await Character.countDocuments();
    const characters = await Character.find()
      .sort({ characterId: 1 })
      .limit(20);
    res.render("characters/list", {
      title: "All Characters - Rick and Morty",
      characters: characters,
      count: totalCharacters,
    });
  } catch (error) {
    console.error("Error fetching characters:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to fetch characters",
    });
  }
};

// Get character by ID
exports.getCharacterById = async (req, res) => {
  try {
    const character = await Character.findOne({
      characterId: req.params.id,
    });
    if (!character) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Character not found",
      });
    }
    res.render("characters/detail", {
      title: `${character.name} - Rick and Morty`,
      character: character,
    });
  } catch (error) {
    console.error("Error fetching character:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to fetch character",
    });
  }
};
