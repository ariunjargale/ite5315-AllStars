const Location = require("../models/Location");
const Character = require("../models/Character");

// Get all locations
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ locationId: 1 });
    res.render("locations/list", {
      title: "All Locations - Rick and Morty",
      locations: locations,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to fetch locations",
    });
  }
};

// Get location by ID
exports.getLocationById = async (req, res) => {
  try {
    const location = await Location.findOne({
      locationId: req.params.id,
    });

    if (!location) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Location not found",
      });
    }

    // Find all characters whose location.id matches this locationId
    const residents = await Character.find({
      "location.id": Number(req.params.id),
    });

    res.render("locations/detail", {
      title: `${location.name} - Location Details`,
      location: location,
      residents: residents,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to fetch location details",
    });
  }
};
