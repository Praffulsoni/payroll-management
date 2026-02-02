const Organization = require("../models/Organization");

// Create or Update organization details
exports.saveOrganization = async (req, res) => {
  try {
    let org = await Organization.findOne();

    if (org) {
      org = await Organization.findByIdAndUpdate(org._id, req.body, {
        new: true,
      });
      return res.json({ message: "Organization updated", organization: org });
    }

    const newOrg = await Organization.create(req.body);
    res.status(201).json({ message: "Organization created", organization: newOrg });
  } catch (error) {
    res.status(500).json({ message: "Error saving organization", error: error.message });
  }
};

// Get organization details
exports.getOrganization = async (req, res) => {
  try {
    const org = await Organization.findOne();
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: "Error fetching organization", error: error.message });
  }
};
