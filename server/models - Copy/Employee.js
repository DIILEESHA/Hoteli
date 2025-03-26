const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },

    employeeId: {
      type: String,
      required: true,
    },
    userID: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    leaves: [],
    department: {
      type: String,
      default: "General",
    },
    photoUrl: {
      type: String,
      default: "",
    },
    customerSatisfaction: {
      type: Number,
      default: 0,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    recentAchievement: {
      type: String,
      default: "",
    },
    lastUpdated: { type: Date, default: null }, // Track last update timestamp
    isUpdated: { type: Boolean, default: false }, // Track if the employee has updated their detai
  },
  { timestamps: true }
);

const employeeModel = mongoose.model("employees", employeeSchema);
module.exports = employeeModel;
