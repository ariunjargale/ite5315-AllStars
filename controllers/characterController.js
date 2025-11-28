const Character = require("../models/Character");
const { validationResult, query } = require("express-validator");
// Get all characters
exports.getAllCharacters = async (req, res) => {
  try {
    // Validate query parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("error", {
        title: "Bad Request",
        message: "Invalid search parameters",
      });
    }

    // Pagination setup
    const pageLimit = 12;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * pageLimit;

    // Filters
    const { name, species, status, gender } = req.query;
    let dbQuery = {};

    // Case-insensitive partial match for text fields
    if (name) dbQuery.name = { $regex: name, $options: "i" };
    if (species) dbQuery.species = { $regex: species, $options: "i" };

    // Exact match for gender/enum fields
    if (gender) dbQuery.gender = gender;

    // Convert boolean status
    if (status) {
      if (status === "alive") dbQuery.isAlive = true;
      else if (status === "dead") dbQuery.isAlive = false;
    }

    // Fetch characters with pagination
    const characters = await Character.find(dbQuery)
      .sort({ characterId: 1 })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    // Total characters with current filters
    const totalCharacters = await Character.countDocuments(dbQuery);
    // Total pages with current filters
    const totalPages = Math.ceil(totalCharacters / pageLimit);

    res.render("characters/list", {
      title: "All Characters - Rick and Morty",
      characters: characters,
      totalCount: totalCharacters,
      currentPage: page,
      totalPages: Math.ceil(totalCharacters / pageLimit),
      query: req.query,
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
