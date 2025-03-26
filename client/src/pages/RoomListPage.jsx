import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RoomListPage() {
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [bestSelling, setBestSelling] = useState([]);
    const [reservations, setReservations] = useState([]); // To store reservations data
    const navigate = useNavigate(); // Hook for navigation

    // Fetch best-selling rooms on component mount
    useEffect(() => {
        const fetchBestSelling = async () => {
            try {
                const bestSellingResponse = await axios.get("/api/room/getBestSelling");
                setBestSelling(bestSellingResponse.data.rooms);
            } catch (error) {
                console.error("Error fetching best-selling rooms:", error);
            }
        };
        fetchBestSelling();
    }, []);

    // Fetch rooms on component mount
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await axios.get("/api/room/getRooms");
                setRooms(response.data.rooms);
                setFilteredRooms(response.data.rooms); // Initially, show all rooms
            } catch (error) {
                console.error("Error fetching rooms:", error);
            }
        };
        fetchRooms();
    }, []);

    // Fetch reservations to check booked rooms
    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await axios.get("/api/room/getBookings");
                setReservations(response.data.bookings); // Store all reservations
            } catch (error) {
                console.error("Error fetching reservations:", error);
            }
        };
        fetchReservations();
    }, []);

    // Filter rooms based on search term
    useEffect(() => {
        const tempList = rooms.filter(
            (room) =>
                (room.roomType &&
                    room.roomType.toLowerCase().includes(searchTerm.toLowerCase())) || // Filter by room type
                (room.roomNumber &&
                    room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) || // Filter by room number
                (room.facilities &&
                    room.facilities.toLowerCase().includes(searchTerm.toLowerCase())) // Filter by facilities
        );
        setFilteredRooms(tempList);
    }, [searchTerm, rooms]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Retrieve the current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // Check if a room is already booked based on reservations
    const isRoomBooked = (roomNumber) => {
        return reservations.some((booking) => booking.roomNumber === roomNumber);
    };

    const handleMoreInfo = async (roomId) => {
        try {
            if (!currentUser || !currentUser._id) {
                console.error("No userId found in localStorage");
                alert("Please log in to continue.");
                return;
            }

            const userId = currentUser._id; // Fetch the userId from currentUser

            // Send request to save user suggestion
            const response = await axios.post("/api/room/saveSuggestion", {
                userId,
                roomId,
            });

            if (response.status === 201) {
                console.log("Suggestion saved successfully");
                // Store the last visited room ID in localStorage
                localStorage.setItem('lastVisitedRoomId', roomId);
                navigate(`/rooms/${roomId}`);
            } else {
                console.error("Failed to save suggestion");
                alert("Failed to save room suggestion.");
            }
        } catch (error) {
            console.error("Error saving user suggestion:", error);
            alert("An error occurred while saving your suggestion.");
        }
    };

    // Function to get the last visited room and similar rooms
    const getSimilarRooms = () => {
        // Get the last visited room ID from localStorage
        const lastVisitedRoomId = localStorage.getItem('lastVisitedRoomId');
        if (!lastVisitedRoomId) {
            return { lastVisitedRoom: null, similarRooms: [] };
        }

        // Find the last visited room in the rooms array
        const lastVisitedRoom = rooms.find(room => room._id === lastVisitedRoomId);

        if (!lastVisitedRoom) {
            return { lastVisitedRoom: null, similarRooms: [] };
        }

        // Exclude the last visited room from similar rooms
        const similarRooms = rooms.filter((room) => {
            // Exclude the last visited room
            if (room._id === lastVisitedRoom._id) {
                return false;
            }

            // Only include rooms with status 'Activate'
            if (room.status !== "Activate") {
                return false;
            }

            let matchCount = 0;

            // Check if the price is similar (within a 20% range)
            if (
                Math.abs(room.price - lastVisitedRoom.price) / lastVisitedRoom.price <= 0.2
            ) {
                matchCount++;
            }

            // Check if roomType is the same
            if (room.roomType === lastVisitedRoom.roomType) {
                matchCount++;
            }

            // Check if at least one facility overlaps
            if (room.facilities && lastVisitedRoom.facilities) {
                // Convert facilities to arrays (if not already arrays)
                const roomFacilities = Array.isArray(room.facilities)
                    ? room.facilities
                    : room.facilities.split(",").map((f) => f.trim());

                const lastVisitedFacilities = Array.isArray(lastVisitedRoom.facilities)
                    ? lastVisitedRoom.facilities
                    : lastVisitedRoom.facilities.split(",").map((f) => f.trim());

                // Check if there is any common facility between the two rooms
                const hasCommonFacilities = roomFacilities.some((facility) =>
                    lastVisitedFacilities.includes(facility)
                );

                if (hasCommonFacilities) {
                    matchCount++;
                }
            }

            // Only return rooms that match at least two attributes
            return matchCount >= 2;
        });

        return { lastVisitedRoom, similarRooms };
    };

    const { lastVisitedRoom, similarRooms } = getSimilarRooms(); // Get last visited room and similar rooms

    // SuggestionCard component
    const SuggestionCard = ({ room }) => {
        const navigate = useNavigate(); // Initialize navigation
    
        // Handle navigation to the room details page
        const handleCardClick = (roomId) => {
            navigate(`/rooms/${roomId}`); // Navigate to the room details page based on roomId
        };
    
        return (
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "10px",
                    margin: "10px",
                    width: "200px",
                    textAlign: "center",
                    cursor: "pointer", // Change cursor to pointer to indicate it's clickable
                }}
                onClick={() => handleCardClick(room._id)} // Trigger navigation when the card is clicked
            >
                <img
                    src={room.imageUrl}
                    alt={room.roomType}
                    style={{
                        width: "100%",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "4px",
                    }}
                />
                <h3 style={{ margin: "10px 0" }}>{room.roomType}</h3>
                <p>Rs: {room.price}</p>
            </div>
        );
    };

    return (
        <div className="room-list">
            <h1 style={{ marginLeft: 30 }}>Our Rooms</h1>
            <hr />
            <div>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search rooms"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        style={{
                            marginBottom: "1.5rem",
                            width: "300px",
                        }}
                    />
                </div>
            </div>
            <div style={{ margin: "20px 0" }}>
                <h2 style={{ marginBottom: "15px" }}>Suggestions for You</h2>
                <div
                    style={{
                        display: "flex",
                        overflowX: "auto",
                        padding: "10px 0",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {/* Best Selling Rooms */}
                    <div>
                        <h3 style={{ margin: "10px 0" }}>Best Selling Rooms</h3>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                            }}
                        >
                            {bestSelling.slice(0, 2).map((room) => (
                                <SuggestionCard key={room._id} room={room} />
                            ))}
                        </div>
                    </div>
                    {/* Recommended for You */}
                    {currentUser && lastVisitedRoom && (
                        <div style={{ marginLeft: "20px" }}>
                            <h3 style={{ margin: "10px 0" }}>Recommended for You</h3>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                }}
                            >
                                <SuggestionCard key={lastVisitedRoom._id} room={lastVisitedRoom} />
                                {similarRooms.slice(0, 2).map((room) => (
                                    <SuggestionCard key={room._id} room={room} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/* List of All Rooms */}
                {filteredRooms
                    .filter((room) => room.status === "Activate") // Filter rooms by status
                    .map((room) => (
                        <div className="room" key={room._id}>
                            <img src={room.imageUrl} alt={room.roomType} />
                            <div className="room-details">
                                <h2>{room.roomType}</h2>
                                <p>Size: {room.size} Person</p>
                                <p>Beds: {room.bedType}</p>
                                <div className="room-icons">
                                    {(Array.isArray(room.facilities)
                                        ? room.facilities
                                        : []
                                    ).map((icon, index) => (
                                        <span key={index}>{icon}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="room-price">
                                <p>From</p>
                                <p>Rs: {room.price}</p>
                                <button
                                    onClick={() => handleMoreInfo(room._id)}
                                    disabled={isRoomBooked(room.roomNumber)} // Disable the button if the room is already booked
                                    style={{
                                        backgroundColor: isRoomBooked(room.roomNumber) ? "#aaa" : "#219652", // Change button color when booked
                                        color: "white",
                                        border: "none",
                                        padding: "5px 10px",
                                        borderRadius: "4px",
                                        cursor: isRoomBooked(room.roomNumber) ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {isRoomBooked(room.roomNumber) ? "Already Booked" : "More Info"}
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default RoomListPage;
