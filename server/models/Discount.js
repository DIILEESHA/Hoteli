const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // e.g., "Off-Season Special"
  },
  description: {
    type: String, // e.g., "20% off all packages in March"
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  value: {
    type: Number,
    required: true, // e.g., 20 (for 20%) or 30 (for $30)
    min: 0,
  },
  applicablePackages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomPackage', // References RoomPackage model, empty means "all"
  }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Discount', discountSchema);