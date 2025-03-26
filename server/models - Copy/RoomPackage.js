// models/RoomPackage.js
const mongoose = require('mongoose');

const roomPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // e.g., "Deluxe Spa Getaway"
  },
  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType', // References RoomType model
    required: true,
  },
  basePrice: {
    type: Number,
    required: true, // e.g., 150 (in dollars)
    min: 0,
  },
  capacity: {
    type: Number,
    required: true, // e.g., 2-3 guests
    min: 1,
  },
  features: [{
    type: String, // e.g., ["Free Wi-Fi", "Spa Discount"]
  }],
  image: {
    type: String, // URL or path to image
  },
}, { timestamps: true });

module.exports = mongoose.model('RoomPackage', roomPackageSchema);
