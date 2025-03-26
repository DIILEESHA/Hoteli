const express = require('express');
const router = express.Router();
const employeeModel = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Helper function to generate unique employee ID
async function generateUniqueEmployeeId() {
    let unique = false;
    let employeeId;

    while (!unique) {
        const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
        employeeId = `E${randomNumber}`;
        
        const existingEmployee = await employeeModel.findOne({ employeeId });
        if (!existingEmployee) {
            unique = true;
        }
    }
    return employeeId;
}

// Fetch a single employee by userID
router.get('/getEmployee/:userID', async (req, res) => {
    try {
        const employee = await User.findOne({ userID: req.params.userID });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Fetch all employees (users with userType === "Employee")
router.get('/getEmployeeNames', async (req, res) => {
    try {
      const employees = await User.find({ userType: "Employee" }, { firstName: 1, lastName: 1, userID: 1,email: 1,username:1});
      res.json(employees);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

// Fetch all employees
router.get('/getEmployees', async (req, res) => {
    try {
        const employees = await employeeModel.find();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Add new employee
router.post('/addEmployee', async (req, res) => {
    try {
        const { firstName, lastName, email, username, department, tasksCompleted, recentAchievement, imageUrl } = req.body;

     
        // Generate unique Employee ID
        const employeeId = await generateUniqueEmployeeId();
        const randomPwd = Math.random().toString(36).substr(2, 9);

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPwd, salt);

        // Create new employee
        const newEmployee = new employeeModel({
            employeeId,
            userID: Math.random().toString(36).substr(2, 9),
            firstName,
            lastName,
            email,
            username,
            department,
            tasksCompleted,
            recentAchievement,
            imageUrl,
            password: hashedPassword,
        });

        await newEmployee.save();

        // Register the employee as a user
        const newUser = new User({
            userID: employeeId,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            username,
            userType: "Employee",
        });

        const savedUser = await newUser.save();

        const userResponse = {
            _id: savedUser._id,
            userID: savedUser.userID,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            email: savedUser.email,
            username: savedUser.username,
            userType: savedUser.userType,
            createdAt: savedUser.createdAt,
            updatedAt: savedUser.updatedAt
        };

        res.status(201).json({
            message: 'Employee added and registered as user successfully',
            employee: newEmployee,
            user: userResponse
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});



// Update employee details
// Update employee details
router.put('/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { firstName, lastName, email, username, department, imageUrl, tasksCompleted, recentAchievement } = req.body;

        const updatedEmployee = await employeeModel.findOneAndUpdate(
            { employeeId },
            { 
                firstName, 
                lastName, 
                email, 
                username, 
                department, 
                imageUrl, 
                tasksCompleted, 
                recentAchievement 
            },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update the corresponding User document
        await User.findOneAndUpdate(
            { userID: employeeId },
            { 
                firstName, 
                lastName, 
                email, 
                username 
            }
        );

        res.json(updatedEmployee);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete employee
router.post('/deleteEmployee', async (req, res) => {
    try {
        const { employeeId } = req.body;
        const deletedEmployee = await employeeModel.findOneAndDelete({ employeeId });
        
        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Delete the corresponding User document
        await User.findOneAndDelete({ userID: employeeId });

        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;