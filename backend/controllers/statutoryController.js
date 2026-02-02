const Statutory = require("../models/Statutory");

// Create or update statutory configuration
exports.saveStatutoryConfig = async (req, res) => {
  try {
    let config = await Statutory.findOne();

    if (config) {
      config = await Statutory.findByIdAndUpdate(config._id, req.body, {
        new: true,
      });
      return res.json({ message: "Statutory configuration updated", config });
    }

    const newConfig = await Statutory.create(req.body);
    res.status(201).json({ message: "Statutory configuration created", config: newConfig });
  } catch (error) {
    res.status(500).json({ message: "Error saving statutory config", error: error.message });
  }
};

// Get statutory configuration
exports.getStatutoryConfig = async (req, res) => {
  try {
    const config = await Statutory.findOne();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error fetching statutory config", error: error.message });
  }
};
