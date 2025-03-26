import React, { useState, useEffect } from "react";
import axios from "axios";
import { message } from "antd";
import parkingImg from "../assets/Images/ParkingImg.png";

function ParkingPage() {
    // State to store the selected date for booking
    const [selectedDate, setSelectedDate] = useState("");
    // State to store the available parking slots for the selected date
    const [availability, setAvailability] = useState([]);
    // State to store the vehicle number entered by the user
    const [vehicleNumber, setVehicleNumber] = useState("");
    // State to store the selected parking slot
    const [selectedSlot, setSelectedSlot] = useState("");
    // State to store the selected booking duration (e.g., Full day, 12 hours, 6 hours)
    const [bookingDuration, setBookingDuration] = useState("Full day");
    // State to store the user information
    const [user, setUser] = useState(null);
    // State to store the calculated price based on selected slot and duration
    const [price, setPrice] = useState(0);

    // Effect to fetch parking availability whenever the selected date changes
    useEffect(() => {
        if (selectedDate) {
            fetchAvailability();
        }
    }, [selectedDate]);

    // Effect to fetch user information from localStorage when the component mounts
    useEffect(() => {
        const fetchUserByID = async () => {
            // Retrieve user from localStorage
            const userJSON = localStorage.getItem("currentUser");

            // Check if user exists in localStorage
            if (!userJSON) {
                console.error("User not found in localStorage.");
                return;
            }

            // Parse user JSON and set it in state
            const user = JSON.parse(userJSON);
            setUser(user);
            console.log(user);

            // Check if user has a valid userID
            if (!user || !user.userID) {
                console.error("Invalid user object or userID not found.");
                return;
            }
        };

        fetchUserByID();
    }, []);

    // Function to calculate the price based on selected slot and booking duration
    const calculatePrice = () => {
        if (!selectedSlot) return;

        let basePrice = 0;

        // Set base price based on slot type (B for Bikes, C for Cars)
        if (selectedSlot.startsWith("B")) {
            basePrice = 500;
        } else if (selectedSlot.startsWith("C")) {
            basePrice = 1000;
        }

        // Adjust price based on booking duration
        switch (bookingDuration) {
            case "Full day":
                setPrice(basePrice);
                break;
            case "12 hours":
                setPrice(basePrice * 0.75);
                break;
            case "6 hours":
                setPrice(basePrice * 0.5);
                break;
            default:
                setPrice(basePrice);
        }
    };

    // Effect to recalculate the price whenever the selected slot or duration changes
    useEffect(() => {
        calculatePrice();
    }, [selectedSlot, bookingDuration]);

    // Function to fetch parking slot availability from the server
    const fetchAvailability = async () => {
        try {
            const response = await axios.get(`/api/parking/availability`, {
                params: { date: selectedDate, userID: user.userID },
            });
            setAvailability(response.data);
        } catch (error) {
            message.error("Failed to fetch availability.");
        }
    };

    // Function to handle booking a parking slot
    const handleBookNow = async () => {
        // Ensure all necessary fields are filled
        if (!vehicleNumber || !selectedSlot || !selectedDate) {
            message.error("Please fill all the fields.");
            return;
        }
    
        if (!user || !user.userID) {
            message.error("User not found. Please log in again.");
            return;
        }
    
        // Check the selected date is ahead of the current date
        const currentDate = new Date();
        const selectedDateObj = new Date(selectedDate);
        if (selectedDateObj < currentDate) {
            message.error("Please select a valid date.");
            return;
        }
    
        try {
            // Send booking request to the server
            await axios.post("/api/parking/book", {
                vehicleNumber,
                parkingSlot: selectedSlot,
                date: selectedDate,
                duration: bookingDuration,
                userID: user.userID,
                Price: price,
            });
    
            message.success("Parking slot booked successfully.");
    
            // After successful booking, send the gate pass email
            const bookingDetails = {
                vehicleNumber,
                selectedSlot,
                selectedDate,
                bookingDuration,
                price,
            };
    
            await axios.post("/api/parking/send-gatepass", {
                userEmail: user.email, // Assuming user.email is available in your user object
                bookingDetails,
            });
    
            message.success("Gate pass sent to your email.");
    
            // Refresh availability after booking
            fetchAvailability();
        } catch (error) {
            message.error("Failed to book the parking slot or send the gate pass.");
        }
    };
    

    return (
        <div className="parking-page1244">
            <div className="parking-header1244">
                <img src={parkingImg} alt="Parking" />
            </div>
            <div className="date-picker-container1244">
                <p>Select a date to view availability:</p>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-picker1244"
                    placeholder="Select date"
                />
            </div>
            {!selectedDate && (
                <div className="no-date-selected1244">
                    Please select a date to view availability.
                </div>
            )}
            {selectedDate && (
                <div className="availability-grid1244">
                    {/* Generate a grid of parking slots (5 rows, 10 columns) */}
                    {Array.from({ length: 5 }).map((_, rowIndex) => (
                        <div className="row1244" key={rowIndex}>
                            {Array.from({ length: 10 }).map((_, colIndex) => {
                                let slotId;
                                if (rowIndex < 2) {
                                    // Bikes: B1, B2, ... B20
                                    slotId = `B${colIndex + 1 + rowIndex * 10}`;
                                } else {
                                    // Cars: C21, C22, ... C50
                                    slotId = `C${
                                        colIndex + 1 + (rowIndex - 2) * 10
                                    }`;
                                }
                                // Check if the slot is available
                                const isAvailable =
                                    availability.includes(slotId);
                                return (
                                    <div
                                        className={`cell1244 ${
                                            isAvailable
                                                ? "available1244"
                                                : "booked1244"
                                        }`}
                                        key={colIndex}
                                    >
                                        {slotId}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
            <hr style={{width : "80%", alignSelf : "center"}} />
            <div className="booking-form1244">
                <h3>Book a parking slot</h3>
                <div className="bookig_form-row">
                    <input
                        type="text"
                        className="vehicle-number-input1244"
                        placeholder="Vehicle Number"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        disabled={selectedDate ? false : true} // Disable input if no date is selected
                    />
                    <select
                        className="slot-select1244"
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        disabled={selectedDate ? false : true} // Disable input if no date is selected
                    >
                        <option value="" disabled>
                            Select the slot
                        </option>
                        {availability.map((slot) => (
                            <option value={slot} key={slot}>
                                {slot}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="bookig_form-row">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-picker-form-1244"
                        placeholder="Select date"
                        disabled={selectedDate ? false : true} // Disable input if no date is selected
                    />
                    <select
                        className="duration-select1244"
                        value={bookingDuration}
                        onChange={(e) => setBookingDuration(e.target.value)}
                        disabled={selectedDate ? false : true} // Disable input if no date is selected
                    >
                        <option value="Full day">Full day</option>
                        <option value="12 hours">12 hours</option>
                        <option value="6 hours">6 hours</option>
                    </select>
                </div>
                <div className="price-display1244">Price: LKR {price}</div>
                <button
                    className="book-now-btn1244"
                    onClick={handleBookNow}
                    disabled={selectedDate ? false : true} // Disable button if no date is selected
                >
                    Book Now
                </button>
            </div>
        </div>
    );
}

export default ParkingPage;
