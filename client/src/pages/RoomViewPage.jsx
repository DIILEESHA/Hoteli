import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import { Modal, Form, Input, Button, DatePicker, Select, message } from "antd";
import moment from "moment"; // Import moment library to work with dates
import roomimg from "../assets/Images/roomimg.jpg"; // Use default image if no image is provided

function RoomViewPage() {
        const { id } = useParams(); // Get the room ID from the URL
        const navigate = useNavigate(); // Initialize navigate for redirection
        const [room, setRoom] = useState(null);
        const [packages, setPackages] = useState([]);
        const [selectedPackages, setSelectedPackages] = useState([]);
        const [totalPrice, setTotalPrice] = useState(0);
        const [calculatedPrice, setCalculatedPrice] = useState(0);
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [form] = Form.useForm(); // Ant Design Form instance

        // Fetch the room data from the server
        useEffect(() => {
                const fetchRoom = async () => {
                        try {
                                const response = await axios.get(
                                        `/api/room/getRoom/${id}`
                                );
                                setRoom(response.data.room);
                                console.log(response.data);
                                setTotalPrice(response.data.room.price); // Initialize total price with room price
                        } catch (error) {
                                console.error("Error fetching room:", error);
                        }
                };

                fetchRoom();
        }, [id]);

        // Fetch package details
        useEffect(() => {
                const fetchPackages = async () => {
                        try {
                                const response = await axios.get(
                                        `/api/package/getPackages`
                                );
                                setPackages(response.data.packages);
                        } catch (error) {
                                console.error(
                                        "Error fetching packages:",
                                        error
                                );
                        }
                };

                fetchPackages();
        }, []);

        // Handle the change in selected packages
        const handleChange = (values) => {
                const selected = packages.filter((pkg) =>
                        values.includes(pkg._id)
                );
                setSelectedPackages(selected);

                // Calculate total price based on selected packages and room price
                const additionalPrice = selected.reduce(
                        (total, pkg) => total + pkg.price,
                        0
                );
                setCalculatedPrice(totalPrice + additionalPrice);
        };

        // Handle date change and calculate the total price
        const onDateChange = (dates) => {
                if (dates && dates.length === 2) {
                        const [checkInDate, checkOutDate] = dates;
                        const nights = checkOutDate.diff(checkInDate, "days");
                        const additionalPrice = selectedPackages.reduce(
                                (total, pkg) => total + pkg.price,
                                0
                        );
                        const newTotalPrice =
                                room.price * nights + additionalPrice;
                        setCalculatedPrice(newTotalPrice);
                } else {
                        setCalculatedPrice(totalPrice);
                }
        };

        // Handle form submission
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));

        // Redirect to login if not logged in
        useEffect(() => {
                if (!currentUser) {
                        message.error(
                                "You must be logged in to make a reservation."
                        );
                        navigate("/login"); // Redirect to the login page
                }
        }, [currentUser, navigate]);

        if (!currentUser) {
                return null; // Prevent further rendering if user is not logged in
        }
        const userID = currentUser.userID;

        const handleOk = async () => {
                try {
                        const values = await form.validateFields(); // Get form values
                        const reservationData = {
                                userID: userID,
                                roomNumber: room.roomNumber, // Assuming roomNumber is stored as ID
                                guestName: values.name,
                                guestEmail: values.email,
                                guestPhone: values.phone,
                                checkInDate:
                                        values.dates[0].format("YYYY-MM-DD"), //  dates are in moment format
                                checkOutDate:
                                        values.dates[1].format("YYYY-MM-DD"),
                                packages: selectedPackages.map(
                                        (pkg) => pkg.packageName
                                ),
                                totalAmount: totalPrice,
                        };

                        // Save the reservation data to the database
                        await axios.post(
                                `/api/room/reserveRoom/${id}`,
                                reservationData
                        );

                        console.log("Reservation data:", reservationData);
                        setIsModalOpen(false); // Close the modal after saving
                        form.resetFields(); // Reset the form
                        message.success("Reservation successful!");
                } catch (error) {
                        console.error("Failed to reserve:", error);
                        message.error("Reservation failed. Please try again.");
                }
        };

        // Function to show the modal
        const showModal = () => {
                setIsModalOpen(true);
        };

        const handleCancel = () => {
                setIsModalOpen(false);
        };

        // Calculate the partial refund date
        const fullRefundDate = moment().add(2, "days").format("MMM Do YYYY");
        const partialRefundDate = moment().add(3, "days").format("MMM Do YYYY");

        if (!room) return <p>Loading...</p>;

        return (
                <div className="room-details-page">
                        <div className="room-image">
                                <img
                                        src={room.imageUrl || roomimg}
                                        alt={room.roomType}
                                />
                        </div>
                        <div className="room-info">
                                <h1>
                                        {room.roomType}{" "}
                                        <span>{room.size} Person</span>
                                </h1>
                                <ul className="room-description">
                                        <li>{room.facilities}</li>
                                        <li>
                                                {room.viewInformation ||
                                                        "No view information available"}
                                        </li>
                                </ul>
                                <h3>Bed Type</h3>
                                <p>
                                        {room.bedType ||
                                                "No bed type information available"}
                                </p>

                                <h3>Room Amenities</h3>
                                <ul className="room-amenities">
                                        {(Array.isArray(room.amenities)
                                                ? room.amenities
                                                : []
                                        ).map((amenity, index) => (
                                                <li key={index}>{amenity}</li>
                                        ))}
                                </ul>

                                <h3>Package</h3>
                                <Select
                                        mode="multiple"
                                        style={{ width: 470, marginBottom: 20 }}
                                        onChange={handleChange}
                                        options={packages.map((pkg) => ({
                                                value: pkg._id,
                                                label: pkg.packageName,
                                        }))}
                                        placeholder="Select packages"
                                />

                                {/* Display selected packages */}
                                {selectedPackages.length > 0 && (
                                        <div className="selected-packages">
                                                <h4>Selected Packages:</h4>
                                                <ul>
                                                        {selectedPackages.map(
                                                                (pkg) => (
                                                                        <li
                                                                                key={
                                                                                        pkg._id
                                                                                }
                                                                        >
                                                                                {
                                                                                        pkg.packageName
                                                                                }{" "}
                                                                                -
                                                                                Rs:{" "}
                                                                                {
                                                                                        pkg.price
                                                                                }
                                                                        </li>
                                                                )
                                                        )}
                                                </ul>
                                        </div>
                                )}

                                <h3>Cancellation Rules</h3>
                                <p className="cancellation-rules">
                                        Free cancellation until{" "}
                                        <strong>{fullRefundDate}</strong>.
                                        <br />
                                        After{" "}
                                        <strong>
                                                {partialRefundDate}
                                        </strong>: <span>50% refund.</span>
                                </p>

                                <div className="pricing">
                                        <div className="add-prices">
                                                <p>Room Price</p>
                                                <p>Rs: {room.price}</p>
                                        </div>
                                        <div className="add-prices">
                                                <p>Selected Packages</p>
                                                <p>
                                                        Rs:{" "}
                                                        {selectedPackages.reduce(
                                                                (total, pkg) =>
                                                                        total +
                                                                        pkg.price,
                                                                0
                                                        )}
                                                </p>
                                        </div>
                                        <div className="total-save">
                                                <p>Total Cost</p>
                                                <p>Rs: {calculatedPrice}</p>
                                        </div>
                                        <button
                                                className="choose-button"
                                                onClick={showModal}
                                        >
                                                Reserve
                                        </button>
                                </div>
                                {/* Reservation Modal */}
                                <Modal
                                        title="Reserve Room"
                                        open={isModalOpen}
                                        onOk={handleOk}
                                        onCancel={handleCancel}
                                        footer={[
                                                <Button
                                                        key="cancel"
                                                        onClick={handleCancel}
                                                        className="custom-cancel-button"
                                                >
                                                        Cancel
                                                </Button>,
                                                <Button
                                                        key="submit"
                                                        type="primary"
                                                        onClick={handleOk}
                                                        className="custom-submit-button"
                                                >
                                                        Reserve
                                                </Button>,
                                        ]}
                                        className="custom-reservation-modal"
                                >
                                        <Form form={form} layout="vertical">
                                                <Form.Item
                                                        label="Name"
                                                        name="name"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter your name",
                                                                },
                                                        ]}
                                                >
                                                        <Input />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Email"
                                                        name="email"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter your email",
                                                                },
                                                                {
                                                                        type: "email",
                                                                        message: "Please enter a valid email",
                                                                },
                                                        ]}
                                                >
                                                        <Input />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Phone"
                                                        name="phone"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter your phone number",
                                                                },
                                                                {
                                                                        pattern: /^[0-9]+$/,
                                                                        message: "Please enter a valid phone number",
                                                                },
                                                        ]}
                                                >
                                                        <Input />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Check-in & Check-out Dates"
                                                        name="dates"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please select the check-in and check-out dates",
                                                                },
                                                        ]}
                                                >
                                                        <DatePicker.RangePicker
                                                                format="YYYY-MM-DD"
                                                                onChange={
                                                                        onDateChange
                                                                }
                                                        />
                                                </Form.Item>
                                        </Form>
                                </Modal>
                        </div>
                </div>
        );
}

export default RoomViewPage;
