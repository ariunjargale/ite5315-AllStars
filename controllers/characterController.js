const Character = require("../models/Character");
const Location = require("../models/Location");
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
  console.log(errors);
  if (!errors.isEmpty()) {
    return res.render("characters/form", {
      title: "Add New Character",
      action: "/characters/create",
      errors: errors.array(),
      character: req.body,
    });
  }

  try {
    // Check locatino and origin are exist
    // const locationObj = await Location.findOne({ id: req.body.locationId });
    // if (!locationObj) {
    //   return res.status(404).render("error", {
    //     title: "Not Found",
    //     message: "Location not found",
    //   });
    // }

    // const originObj = await Location.findOne({ id: req.body.originId });
    // if (!originObj) {
    //   return res.status(404).render("error", {
    //     title: "Not Found",
    //     message: "Origin not found",
    //   });
    // }

    // New ID
    const lastChar = await Character.findOne().sort({ characterId: -1 });
    const newId = lastChar ? lastChar.characterId + 1 : 1;
    console.log("New Character ID:", newId);
    // Convert episodes from comma-separated string to array of integers
    const episodeArray = req.body.episode
      .split(",")
      .map((num) => parseInt(num.trim()))
      .filter((num) => !isNaN(num));

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
        id: locationObj ? locationObj.id : 0,
      },
      origin: {
        name: originObj ? originObj.name : "Unknown",
        id: originObj ? originObj.id : 0,
      },
      episode: episodeArray,
      created: new Date(),
    });

    await newCharacter.save();
    res.redirect("/characters");
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Database Error" });
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Redirect back to form with errors
    return res.render("characters/form", {
      title: `Edit Character`,
      action: `/characters/edit/${req.params.id}`,
      errors: errors.array(),
      character: { ...req.body, characterId: req.params.id }, // retain ID
      isEdit: true,
    });
  }

  try {
    // Check locatino and origin are exist
    // const locationObj = await Location.findOne({ id: req.body.locationId });
    // if (!locationObj) {
    //   return res.status(404).render("error", {
    //     title: "Not Found",
    //     message: "Location not found",
    //   });
    // }

    // const originObj = await Location.findOne({ id: req.body.originId });
    // if (!originObj) {
    //   return res.status(404).render("error", {
    //     title: "Not Found",
    //     message: "Origin not found",
    //   });
    // }

    // Convert episodes from comma-separated string to array of integers
    const episodeArray = req.body.episode
      .toString()
      .split(",")
      .map((num) => parseInt(num.trim()));

    const updateData = {
      name: req.body.name,
      isAlive: req.body.isAlive === "true",
      species: req.body.species,
      type: req.body.type,
      gender: req.body.gender,
      image: req.body.image,
      location: {
        name: locationObj ? locationObj.name : "Unknown",
        id: locationObj ? locationObj.id : 0,
      },
      origin: {
        name: originObj ? originObj.name : "Unknown",
        id: originObj ? originObj.id : 0,
      },
      episode: episodeArray,
      updated: new Date(),
    };

    await Character.findOneAndUpdate(
      { characterId: req.params.id },
      updateData
    );

    res.redirect(`/characters/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Update failed");
  }
};
