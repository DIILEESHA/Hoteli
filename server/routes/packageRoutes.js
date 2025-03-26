const express = require('express');
const router = express.Router();
const RoomPackage = require('../models/RoomPackage');
const RoomType = require('../models/RoomType');
const Booking = require('../models/Booking');
const Discount = require('../models/Discount');

// Get all room packages
router.get('/getPackages', async (req, res) => {
  const { checkInDate, checkOutDate } = req.query;
  console.log("Fetching packages with query:", { checkInDate, checkOutDate }); // Debug

  try {
    // Fetch packages and populate roomType
    const packages = await RoomPackage.find().populate('roomType');
    console.log("Packages found:", packages.length); // Debug
    if (!packages.length) {
      return res.status(200).json({ packages: [] }); // Handle empty case
    }

    // Fetch active discounts
    const discounts = await Discount.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });
    console.log("Discounts found:", discounts.length); // Debug

    // Process each package
    const availablePackages = await Promise.all(
      packages.map(async (pkg) => {
        // Check if roomType is populated
        if (!pkg.roomType || !pkg.roomType.totalRooms) {
          console.error(`Package ${pkg._id} has invalid or missing roomType:`, pkg.roomType);
          return null; // Skip invalid packages
        }

        // Safely parse dates, default to no date filter if invalid
        const checkIn = checkInDate ? new Date(checkInDate) : null;
        const checkOut = checkOutDate ? new Date(checkOutDate) : null;
        if (checkInDate && isNaN(checkIn)) {
          console.warn(`Invalid checkInDate: ${checkInDate}`);
          return null;
        }
        if (checkOutDate && isNaN(checkOut)) {
          console.warn(`Invalid checkOutDate: ${checkOutDate}`);
          return null;
        }

        // Count bookings
        const bookingQuery = {
          package: pkg._id,
          status: 'confirmed',
        };
        if (checkIn && checkOut) {
          bookingQuery.checkInDate = { $lte: checkOut };
          bookingQuery.checkOutDate = { $gte: checkIn };
        }
        const bookings = await Booking.countDocuments(bookingQuery);
        console.log(`Package ${pkg._id} - Bookings: ${bookings}`); // Debug

        const availableRooms = pkg.roomType.totalRooms - bookings;
        if (availableRooms <= 0 && checkIn && checkOut) {
          console.log(`Package ${pkg._id} has no available rooms`);
          return null;
        }

        // Apply discount
        let discountedPrice = pkg.basePrice;
        const applicableDiscount = discounts.find((d) =>
          d.applicablePackages.length === 0 || 
          d.applicablePackages.some((id) => id && id.toString() === pkg._id.toString())
        );
        if (applicableDiscount) {
          discountedPrice = applicableDiscount.type === 'percentage'
            ? pkg.basePrice * (1 - applicableDiscount.value / 100)
            : pkg.basePrice - applicableDiscount.value;
        }

        return {
          ...pkg.toObject(),
          availableRooms: checkIn ? availableRooms : pkg.roomType.totalRooms,
          basePrice: pkg.basePrice,
          discountedPrice,
          discountApplied: !!applicableDiscount,
        };
      })
    );

    const filteredPackages = availablePackages.filter((pkg) => pkg !== null);
    console.log("Returning packages:", filteredPackages.length); // Debug
    res.status(200).json({ packages: filteredPackages });
  } catch (error) {
    console.error("Error in getPackages:", error); // Debug
    res.status(500).json({ message: error.message });
  }
});

// Get package by ID
// Get package by ID
router.get('/getPackage/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pkg = await RoomPackage.findById(id).populate('roomType');
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const discounts = await Discount.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    let discountedPrice = pkg.basePrice;
    const applicableDiscount = discounts.find(d =>
      d.applicablePackages.length === 0 || d.applicablePackages.includes(pkg._id)
    );
    if (applicableDiscount) {
      discountedPrice = applicableDiscount.type === 'percentage'
        ? pkg.basePrice * (1 - applicableDiscount.value / 100)
        : pkg.basePrice - applicableDiscount.value;
    }

    res.status(200).json({
      package: {
        ...pkg.toObject(),
        discountedPrice,
        discountApplied: !!applicableDiscount,
      }
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Add new package
router.post('/addPackage', async (req, res) => {
  const { name, roomType, basePrice, capacity, features, image } = req.body;

  try {
    // Validate roomType exists
    const roomTypeExists = await RoomType.findById(roomType);
    if (!roomTypeExists) {
      return res.status(400).json({ message: 'Invalid room type' });
    }

    const newPackage = new RoomPackage({
      name,
      roomType,
      basePrice,
      capacity,
      features,
      image,
    });
    const pkg = await newPackage.save();
    res.status(201).json({ package: pkg });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update package
router.put('/updatePackage/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const updatedPackage = await RoomPackage.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.status(200).json({ package: updatedPackage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete package
router.delete('/deletePackage/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPackage = await RoomPackage.findByIdAndDelete(id);
    if (!deletedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.status(200).json({ package: deletedPackage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New route to get all room types
router.get("/getRoomTypes", async (req, res) => {
  try {
    const roomTypes = await RoomType.find();
    res.status(200).json({ roomTypes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to add a new room type
router.post("/addRoomType", async (req, res) => {
  try {
    const { name, totalRooms, description } = req.body;

    // Check if the room type already exists
    const existingRoomType = await RoomType.findOne({ name });
    if (existingRoomType) {
      return res.status(400).json({ message: "Room type already exists" });
    }

    // Create a new room type
    const newRoomType = new RoomType({
      name,
      totalRooms,
      description,
    });

    await newRoomType.save();
    res.status(201).json({ message: "Room type added successfully", newRoomType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;