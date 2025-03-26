// routes/discounts.js
const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');

// Get all discounts (not just active ones)
router.get('/getDiscounts', async (req, res) => {
  try {
    const discounts = await Discount.find().populate('applicablePackages');
    res.status(200).json({ discounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active discounts (where current date is between start and end dates)
router.get('/getActiveDiscounts', async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('applicablePackages');
    
    res.status(200).json({ discounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get discount by ID
router.get('/getDiscount/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const discount = await Discount.findById(id).populate('applicablePackages');
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.status(200).json({ discount });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Add new discount with automatic expiry
router.post('/addDiscount', async (req, res) => {
  const { name, description, type, value, applicablePackages, startDate, endDate, property } = req.body;

  try {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (end < now) {
      return res.status(400).json({ message: "End date must be in the future" });
    }
    if (end < start) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    // Check for existing discounts
    const existingDiscountByName = await Discount.findOne({ name });
    if (existingDiscountByName) {
      return res.status(400).json({ message: "A discount with this name already exists" });
    }

    if (property) {
      const existingDiscountByProperty = await Discount.findOne({ property });
      if (existingDiscountByProperty) {
        return res.status(400).json({ message: "A discount already exists for this property" });
      }
    }

    if (applicablePackages && applicablePackages.length > 0) {
      const existingDiscountByPackages = await Discount.findOne({
        applicablePackages: { $in: applicablePackages },
      });
      if (existingDiscountByPackages) {
        return res.status(400).json({ message: "A discount already exists for one or more of the specified packages" });
      }
    }

    const newDiscount = new Discount({
      name,
      description,
      type,
      value,
      applicablePackages: Array.isArray(applicablePackages) ? applicablePackages : [],
      startDate: start,
      endDate: end,
      property,
    });

    const discount = await newDiscount.save();
    res.status(201).json({ discount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update discount with expiry validation
router.put('/updateDiscount/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, type, value, applicablePackages, startDate, endDate, property } = req.body;

  try {
    const now = new Date();
    const end = new Date(endDate);

    if (end < now) {
      return res.status(400).json({ message: "End date must be in the future" });
    }

    // Check for existing discounts (excluding current)
    const existingDiscountByName = await Discount.findOne({ name, _id: { $ne: id } });
    if (existingDiscountByName) {
      return res.status(400).json({ message: "A discount with this name already exists" });
    }

    if (property) {
      const existingDiscountByProperty = await Discount.findOne({ property, _id: { $ne: id } });
      if (existingDiscountByProperty) {
        return res.status(400).json({ message: "A discount already exists for this property" });
      }
    }

    if (applicablePackages && applicablePackages.length > 0) {
      const existingDiscountByPackages = await Discount.findOne({
        applicablePackages: { $in: applicablePackages },
        _id: { $ne: id },
      });
      if (existingDiscountByPackages) {
        return res.status(400).json({ message: "A discount already exists for one or more of the specified packages" });
      }
    }

    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      {
        name,
        description,
        type,
        value,
        applicablePackages: Array.isArray(applicablePackages) ? applicablePackages : [],
        startDate: new Date(startDate),
        endDate: end,
        property,
      },
      { new: true }
    );

    if (!updatedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.status(200).json({ discount: updatedDiscount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete discount
router.delete('/deleteDiscount/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDiscount = await Discount.findByIdAndDelete(id);
    if (!deletedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.status(200).json({ discount: deletedDiscount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;