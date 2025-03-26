const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, required: true },
  stockQuantity: { type: Number, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: "In Stock" },
  purchaseDate: { type: Date, required: true },
  expirationDate: { type: Date, required: true },
  supplier: { type: String, required: true },
  minStockLevel: { type: Number, required: true },
  reorderLevel: { type: Number, required: true },
  purchaseHistory: [
    {
      purchaseDate: { type: Date, required: true },
      quantity: { type: Number, required: true },
      supplier: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("Inventory", inventorySchema);
