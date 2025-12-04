const Character = require("../models/Character");
const Location = require("../models/Location");
const { validationResult, query } = require("express-validator");

// Helper function to determine if request expects JSON response
const expectsJson = (req) => {
  // Check if Accept header prefers JSON
  const acceptHeader = req.get("Accept") || "";
  // Check if it's an explicit JSON request or not a browser form submission
  return (
    acceptHeader.includes("application/json") ||
    (!acceptHeader.includes("text/html") && req.method === "POST")
  );
};

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
    const { name, species, status, gender, location, origin } = req.query;
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

    if (location) {
      dbQuery["location.name"] = { $regex: location, $options: "i" };
    }

    if (origin) {
      dbQuery["origin.name"] = { $regex: origin, $options: "i" };
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

// Create Character Form
exports.getCreateForm = async (req, res) => {
  try {
    // Fetch locations for dropdowns
    const locations = await Location.find({}, "locationId name")
      .sort({ name: 1 })
      .lean();

    res.render("characters/form", {
      title: "Add New Character",
      action: "/characters/create",
      isEdit: false,
      locations: locations,
    });
  } catch (error) {
    res.status(500).send("Error loading form");
  }
};

// Create Character
exports.createCharacter = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Return JSON error for API requests
    if (expectsJson(req)) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value,
        })),
      });
    }

    const locations = await Location.find({}, "locationId name")
      .sort({ name: 1 })
      .lean();

    return res.render("characters/form", {
      title: "Add New Character",
      action: "/characters/create",
      errors: errors.array(),
      character: req.body,
      locations: locations,
    });
  }

  try {
    // Check location is exist
    const locationObj = await Location.findOne({
      locationId: +req.body.locationId,
    });

    // Check origin is exist
    const originObj = await Location.findOne({
      locationId: +req.body.originId,
    });

    // New ID
    const lastChar = await Character.findOne().sort({ characterId: -1 });
    const newId = lastChar ? lastChar.characterId + 1 : 1;
    console.log("New Character ID:", newId);
    // Convert episodes from comma-separated string to array of integers
    const episodeArray = req.body.episode
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e !== "")
      .map(Number)
      .filter((n) => !isNaN(n));

    // Create new object
    const newCharacter = new Character({
      characterId: newId,
      name: req.body.name,
      isAlive: req.body.isAlive === "true", // convert to boolean
      species: req.body.species,
      type: req.body.type,
      gender: req.body.gender,
      image: req.body.image,
      location: {
        name: locationObj ? locationObj.name : "Unknown",
        id: locationObj ? locationObj.locationId : 0,
      },
      origin: {
        name: originObj ? originObj.name : "Unknown",
        id: originObj ? originObj.locationId : 0,
      },
      episode: episodeArray,
      created: new Date(),
    });

    await newCharacter.save();

    // Return JSON success for API requests
    if (expectsJson(req)) {
      return res.status(201).json({
        success: true,
        message: "Character created successfully",
        data: newCharacter,
      });
    }

    req.session.success = "Character created successfully!";
    res.redirect("/characters");
  } catch (error) {
    console.error(error);
    errorMessage = "Failed to create character.";
    req.session.error = errorMessage;

    // Return JSON error for API requests
    if (expectsJson(req)) {
      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: err.message,
      });
    }

    res.redirect("/characters");
  }
};

// Edit Character Form
exports.getEditForm = async (req, res) => {
  try {
    const character = await Character.findOne({
      characterId: req.params.id,
    }).lean();
    if (!character) return res.status(404).send("Character not found");

    // Fetch locations for dropdowns
    const locations = await Location.find({}, "locationId name")
      .sort({ name: 1 })
      .lean();

    res.render("characters/form", {
      title: `Edit ${character.name}`,
      action: `/characters/edit/${character.characterId}`,
      character: character,
      locations: locations,
      isEdit: true,
    });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

// Update Character
exports.updateCharacter = async (req, res) => {
  console.log("Update Character Req Body:", req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return JSON error for API requests
    if (expectsJson(req)) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value,
        })),
      });
    }

    const character = await Character.findOne({
      characterId: req.params.id,
    }).lean();
    if (!character) return res.status(404).send("Character not found");

    const locations = await Location.find({}, "locationId name")
      .sort({ name: 1 })
      .lean();

    // Redirect back to form with errors
    return res.render("characters/form", {
      title: `Edit Character`,
      action: `/characters/edit/${req.params.id}`,
      errors: errors.array(),
      character: character, // retain ID
      locations: locations,
      isEdit: true,
    });
  }

  try {
    // Check location is exist
    const locationObj = await Location.findOne({
      locationId: +req.body.locationId,
    });

    // Check origin is exist
    const originObj = await Location.findOne({
      locationId: +req.body.originId,
    });

    // Convert episodes from comma-separated string to array of integers
    const episodeArray = req.body.episode
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e !== "")
      .map(Number)
      .filter((n) => !isNaN(n));

    const updateData = {
      name: req.body.name,
      isAlive: req.body.isAlive === "true",
      species: req.body.species,
      type: req.body.type,
      gender: req.body.gender,
      image: req.body.image,
      location: {
        id: locationObj ? locationObj.locationId : 0,
        name: locationObj.name ? locationObj.name : "Unknown",
      },
      origin: {
        id: originObj ? originObj.locationId : 0,
        name: originObj.name ? originObj.name : "Unknown",
      },
      episode: episodeArray,
      updated: new Date(),
    };

    await Character.findOneAndUpdate(
      { characterId: req.params.id },
      updateData
    );

    // Return JSON success for API requests
    if (expectsJson(req)) {
      return res.status(200).json({
        success: true,
        message: "Character updated successfully",
        data: updateData,
      });
    }

    req.session.success = "Character updated successfully!";
    res.redirect(`/characters/${req.params.id}`);
  } catch (error) {
    console.error(error);

    if (expectsJson(req)) {
      return res.status(500).json({
        success: false,
        error: "Failed to update character",
        details: err.message,
      });
    }
    req.session.error = "Failed to update character.";
    res.redirect("/characters");
  }
};

exports.deleteCharacter = async (req, res) => {
  try {
    await Character.deleteOne({ characterId: req.params.id });

    // Return JSON success for API requests
    if (expectsJson(req)) {
      return res.status(200).json({
        success: true,
        message: "Character deleted successfully",
        data: req.params.id,
      });
    }

    req.session.success = "Character deleted successfully!";
    res.redirect("/characters");
  } catch (error) {
    console.error(error);

    if (expectsJson(req)) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete character",
        details: err.message,
      });
    }

    req.session.error = "Failed to deleted character.";
    res.redirect("/characters");
  }
};
