const Location = require("../models/Location");
const Character = require("../models/Character");

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

    // Return JSON success for API requests
    if (expectsJson(req)) {
      return res.status(201).json({
        success: true,
        message: "Location created successfully",
        data: newLocation,
      });
    }

    res.redirect("/locations");
  } catch (err) {
    console.error(err);

    // Determine error type
    const isDuplicateError =
      err.code === 11000 || err.message.includes("duplicate");
    const statusCode = isDuplicateError ? 409 : 400;
    const errorMessage = isDuplicateError
      ? "Location ID already exists"
      : "Invalid input data";

    // Return JSON error for API requests
    if (expectsJson(req)) {
      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: err.message,
      });
    }

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

    // Return JSON success for API requests
    if (expectsJson(req)) {
      return res.status(200).json({
        success: true,
        message: "Location updated successfully",
        data: req.params.id,
      });
    }

    res.redirect(`/locations/${req.params.id}`);
  } catch (err) {
    console.error(err);

    if (expectsJson(req)) {
      return res.status(500).json({
        success: false,
        error: "Failed to update episode",
        details: err.message,
      });
    }

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
      if (expectsJson(req)) {
        return res.status(404).json({
          success: false,
          error: "Location not found",
        });
      }

      return res.status(404).send("Location not found");
    }

    // Return JSON success for API requests
    if (expectsJson(req)) {
      return res.status(200).json({
        success: true,
        message: "Location deleted successfully",
        data: req.params.id,
      });
    }

    res.redirect("/locations");
  } catch (err) {
    console.error(err);

    if (expectsJson(req)) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete episode",
        details: err.message,
      });
    }

    res.status(500).send("Failed to delete location");
  }
};
