    import React, { useState, useEffect } from "react";
    import axios from "axios";
    import { message, Tabs, ConfigProvider } from "antd";
    import RoomBookings from "../components/User/RoomBookings";
    import EventBookings from "../components/User/EventBookings";
    import FoodOrders from "../components/User/FoodOrders";
    import ParkingBookings from "../components/User/ParkingBookings";
    import LeaveDetails from "../components/User/LeaveDetails";
    import Feedbacks from "../components/User/Feedbacks";
    import Packages from "../components/User/PackageBooking";

    function UserProfilePage() {
        const [user, setUser] = useState({});
        const [isEditing, setIsEditing] = useState(false);
        const [activeTabKey, setActiveTabKey] = useState("1");
        const [formData, setFormData] = useState({
            firstName: "",
            lastName: "",
            email: "",
            username: "",
        });

        // Fetch employee details when the component mounts
        useEffect(() => {
            fetchEmployeeDetails();
        }, []);

        // Fetch employee details from the backend
        const fetchEmployeeDetails = async () => {
            try {
                const currentUser = JSON.parse(localStorage.getItem("currentUser"));
                console.log("Current User:", currentUser); // Log the current user

                if (currentUser) {
                    const response = await axios.get(
                        `http://localhost:5000/api/employee/getEmployee/${currentUser.userID}` // Use userID
                    );
                    const employeeData = response.data;
                    console.log("Employee Data:", employeeData); // Log the fetched employee data

                    setUser(employeeData);
                    setFormData({
                        firstName: employeeData.firstName,
                        lastName: employeeData.lastName,
                        email: employeeData.email,
                        username: employeeData.username,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch employee details", error);
                message.error("Failed to fetch employee details. Please try again.");
            }
        };

        // Handle saving updated employee details
        const handleSave = async () => {
            try {
                const response = await axios.put(
                    "http://localhost:5000/api/user/updateUser",
                    {
                        userID: user.userID,
                        ...formData,
                    }
                );
        
                const updatedUser = response.data.user;
                localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                setUser(updatedUser);
                setIsEditing(false);
        
                // Show success message
                message.success("Profile updated successfully");
            } catch (error) {
                console.error("Failed to update user", error);
        
                // Show error message
                message.error("Failed to update profile. Please try again.");
            }
        };

        // Handle tab change
        const onTabChange = (key) => {
            setActiveTabKey(key);
        };

        // Handle input changes in the form
        const handleInputChange = (e) => {
            const { name, value } = e.target;
            setFormData({
                ...formData,
                [name]: value,
            });
        };

        // Enable editing mode
        const handleEdit = () => {
            setIsEditing(true);
        };

        return (
            <div className={`user-profile-page-1234`}>
                <div className={`profile-card-1234`}>
                    <div className={`profile-header-1234`}>
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Windows_10_Default_Profile_Picture.svg/1200px-Windows_10_Default_Profile_Picture.svg.png"
                            alt="Profile"
                        />
                        <div className={`profile-info-1234`}>
                            <h3>
                                {user.firstName} {user.lastName}
                            </h3>
                            <p>{user.userType}</p>
                        </div>
                    </div>
                    <div className={`profile-details-1234`}>
                        <p>
                            <strong>Email:</strong> {user.email}
                        </p>
                        <p>
                            <strong>Username:</strong> {user.username}
                        </p>
                    </div>
                    <button className={`edit-button-1234`} onClick={handleEdit}>
                        Edit Profile
                    </button>
                </div>
                <div className="additional-features-container-1234">
                    <ConfigProvider
                        theme={{
                            token: {
                                colorPrimary: "#27ae61", // Set your desired primary color
                            },
                        }}
                    >
                        <Tabs
                            defaultActiveKey="1"
                            onChange={onTabChange}
                            activeKey={activeTabKey} // Bind active tab key
                        >
                            <Tabs.TabPane tab="Rooms" key="1">
                                <RoomBookings />
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="Events" key="2">
                                <EventBookings />
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="Foods" key="3">
                                <FoodOrders />
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="Parkings" key="4">
                                <ParkingBookings />
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="Feedbacks" key="5">
                                <Feedbacks />
                            </Tabs.TabPane>
                            {user.userType === "Employee" && (
                                <Tabs.TabPane tab="Leaves" key="6">
                                    <LeaveDetails />
                                </Tabs.TabPane>
                            )}
                            <Tabs.TabPane tab="Packages" key="7">
                                <Packages />
                            </Tabs.TabPane>
                        </Tabs>
                    </ConfigProvider>
                </div>

                {isEditing && (
                    <div className={`edit-modal-1234`}>
                        <div className={`modal-content-1234`}>
                            <h3>Edit Profile</h3>
                            <label>
                                First Name:
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Last Name:
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Email:
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Username:
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <div className={`modal-buttons-1234`}>
                                <button
                                    className={`save-button-1234`}
                                    onClick={handleSave}
                                >
                                    Save
                                </button>
                                <button
                                    className={`cancel-button-1234`}
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    export default UserProfilePage;