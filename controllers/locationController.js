const Location = require("../models/Location");
const Character = require("../models/Character");

// Get all locations (with pagination)
exports.getAllLocations = async (req, res) => {
  try {
    const perPage = 12;
    const page = parseInt(req.query.page) || 1;

    // Build filters
    const filter = {};

    if (req.query.type && req.query.type !== "all") {
      filter.type = req.query.type;
    }

    if (req.query.dimension && req.query.dimension !== "all") {
      filter.dimension = req.query.dimension;
    }

    const totalLocations = await Location.countDocuments(filter);

    const locations = await Location.find(filter)
      .sort({ locationId: 1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    // For blob filters
    const allTypes = await Location.distinct("type");
    const allDimensions = await Location.distinct("dimension");

    res.render("locations/list", {
      title: "All Locations - Rick and Morty",
      locations,
      totalLocations,
      currentPage: page,
      totalPages: Math.ceil(totalLocations / perPage),

      allTypes,
      allDimensions,

      selectedType: req.query.type || "all",
      selectedDimension: req.query.dimension || "all",
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).send("Failed to fetch locations");
  }
};

// Get location by ID (with residents)
exports.getLocationById = async (req, res) => {
  try {
    const location = await Location.findOne({
      locationId: req.params.id,
    });

    if (!location) {
      return res.status(404).send("Location not found");
    }

    // Find all characters whose location.id matches this locationId
    const residents = await Character.find({
      "location.id": Number(req.params.id),
    });

    res.render("locations/detail", {
      title: `${location.name} - Location Details`,
      location,
      residents,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).send("Failed to fetch location details");
  }
};

const { validationResult } = require("express-validator");

// Show create form
exports.showCreateForm = (req, res) => {
  res.render("locations/create", {
    title: "Create New Location",
  });
};

// Create
exports.createLocation = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).render("locations/create", {
      title: "Create New Location",
      errors: errors.array(),
      form: req.body,
    });
  }

  try {
    const newLocation = new Location({
      locationId: req.body.locationId,
      name: req.body.name,
      type: req.body.type,
      dimension: req.body.dimension,
      residents: [],
      created: new Date(),
      updated: new Date(),
    });

    await newLocation.save();

    res.redirect("/locations");
  } catch (err) {
    console.error(err);
    res.status(400).render("locations/create", {
      title: "Create New Location",
      error: "Location ID already exists or invalid input",
      form: req.body,
    });
  }
};

// Show edit form
exports.showEditForm = async (req, res) => {
  try {
    const location = await Location.findOne({ locationId: req.params.id });

    if (!location) {
      return res.status(404).send("Location not found");
    }

    res.render("locations/edit", {
      title: "Edit Location",
      location,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).send("Failed to fetch location");
  }
};

// Update
exports.updateLocation = async (req, res) => {
  try {
    const errors = validationResult(req);

    // First, check if location exists
    const location = await Location.findOne({
      locationId: req.params.id,
    });

    if (!location) {
      return res.status(404).send("Location not found");
    }

    if (!errors.isEmpty()) {
      return res.status(400).render("locations/edit", {
        title: "Edit Location",
        errors: errors.array(),
        location,
      });
    }

    await Location.findOneAndUpdate(
      { locationId: req.params.id },
      {
        name: req.body.name,
        type: req.body.type,
        dimension: req.body.dimension,
        updated: new Date(),
      }
    );

    res.redirect(`/locations/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update location");
  }
};

// Delete
exports.deleteLocation = async (req, res) => {
  try {
    const deletedLocation = await Location.findOneAndDelete({
      locationId: req.params.id,
    });

    if (!deletedLocation) {
      return res.status(404).send("Location not found");
    }

    res.redirect("/locations");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete location");
  }
};
