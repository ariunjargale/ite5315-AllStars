/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
const Location = require("../models/Location");
const Character = require("../models/Character");
const { validationResult } = require("express-validator");

// Helper function to determine if request expects JSON response
const expectsJson = (req) => {
  const acceptHeader = req.get("Accept") || "";
  return (
    acceptHeader.includes("application/json") ||
    (!acceptHeader.includes("text/html") && req.method === "POST")
  );
};

// ============================================================================
// GET ALL LOCATIONS (LIST PAGE)
// ============================================================================
exports.getAllLocations = async (req, res) => {
  try {
    const perPage = 12;
    const page = parseInt(req.query.page) || 1;

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

// ============================================================================
// GET LOCATION BY ID (DETAIL PAGE)
// FIXED: Residents now load FULL Character objects
// ============================================================================
exports.getLocationById = async (req, res) => {
  try {
    const location = await Location.findOne({
      locationId: req.params.id,
    });

    if (!location) {
      return res.status(404).send("Location not found");
    }

    // Ensure resident IDs are numbers
    const residentIds = (location.residents || []).map((id) => Number(id));

    // Fetch full character documents for residents
    const residents = await Character.find({
      characterId: { $in: residentIds },
    }).lean();

    // Log missing residents for debugging
    const missing = residentIds.filter(
      (id) => !residents.some((c) => c.characterId === id)
    );

    if (missing.length > 0) {
      console.warn(
        "⚠ Missing character entries for these IDs in location:",
        req.params.id,
        missing
      );
    }

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

// ============================================================================
// CREATE
// ============================================================================
exports.showCreateForm = (req, res) => {
  res.render("locations/create", {
    title: "Create New Location",
  });
};

exports.createLocation = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
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

    const isDuplicateError =
      err.code === 11000 || err.message.includes("duplicate");

    const errorMessage = isDuplicateError
      ? "Location ID already exists"
      : "Invalid input data";

    if (expectsJson(req)) {
      return res.status(isDuplicateError ? 409 : 400).json({
        success: false,
        error: errorMessage,
        details: err.message,
      });
    }

    res.status(400).render("locations/create", {
      title: "Create New Location",
      error: errorMessage,
      form: req.body,
    });
  }
};

// ============================================================================
// EDIT
// ============================================================================
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

// ============================================================================
// UPDATE
// ============================================================================
exports.updateLocation = async (req, res) => {
  try {
    const errors = validationResult(req);

    const location = await Location.findOne({
      locationId: req.params.id,
    });

    if (!location) {
      return res.status(404).send("Location not found");
    }

    if (!errors.isEmpty()) {
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
        error: "Failed to update location",
        details: err.message,
      });
    }

    res.status(500).send("Failed to update location");
  }
};

// ============================================================================
// DELETE
// ============================================================================
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
        error: "Failed to delete location",
        details: err.message,
      });
    }

    res.status(500).send("Failed to delete location");
  }
};
