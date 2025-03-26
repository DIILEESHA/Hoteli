import React, { useState, useEffect } from "react";
import { Line, Pie } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Progress } from "antd"; // Ant Design Progress for the rating breakdown
import axios from "axios";
import { Link } from "react-router-dom";

// Register necessary chart components
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement);

function Dashboard() {
    const [bookings, setBookings] = useState([]);
    const [eventCount, setEventCount] = useState(0); // State for storing total event count
    const [feedbackCount, setFeedbackCount] = useState(0);
    const [feedbackRatings, setFeedbackRatings] = useState([]);
    const [ratingSummary, setRatingSummary] = useState({
        total: 0,
        ratings: [],
        average: 0
    });
    const [feedbackData, setFeedbackData] = useState({
        totalLikes: 0,
        totalDislikes: 0,
    });

    // Fetch feedback count, ratings, and rating summary from the backend API
    useEffect(() => {
        const fetchFeedbackCount = async () => {
            try {
                const response = await axios.get("/api/feedback/feedbackCount");
                setFeedbackCount(response.data.count);
            } catch (error) {
                console.error("Error fetching feedback count", error);
            }
        };

        const fetchFeedbackRatings = async () => {
            try {
                const response = await axios.get("/api/feedback/feedbackRatingsByMonth");
                setFeedbackRatings(response.data);
            } catch (error) {
                console.error("Error fetching feedback ratings", error);
            }
        };

        const fetchRatingsSummary = async () => {
            try {
                const response = await axios.get("/api/feedback/ratingsSummary");
                setRatingSummary(response.data);
            } catch (error) {
                console.error("Error fetching ratings summary", error);
            }
        };

        const fetchFeedbackLikesDislikes = async () => {
            try {
                const response = await axios.post("/api/feedback/getFeedback", { page: 1, limit: 100 }); // Adjust limit as needed
                const feedbacks = response.data.feedbacks;

                const totalLikes = feedbacks.reduce((acc, feedback) => acc + feedback.likes, 0);
                const totalDislikes = feedbacks.reduce((acc, feedback) => acc + feedback.dislikes, 0);

                setFeedbackData({ totalLikes, totalDislikes });
            } catch (error) {
                console.error("Error fetching feedback likes/dislikes", error);
            }
        };

        fetchFeedbackCount();
        fetchFeedbackRatings();
        fetchRatingsSummary();
        fetchFeedbackLikesDislikes(); // Fetch like and dislike counts
    }, []);


    // Fetch event count from the backend API
    const fetchEventCount = async () => {
        try {
            const response = await axios.get("/api/event/getTotalEvents");
            console.log("API Response:", response.data); // Log the API response to inspect the data

            // Use totalEvents from the response
            if (response.data.totalEvents) {
                setEventCount(response.data.totalEvents); // Set the total event count
            } else {
                console.error("totalEvents not found in response.");
            }
        } catch (error) {
            console.error("Error fetching event count:", error);
        }
    };

    // Call the function in useEffect
    useEffect(() => {
        fetchEventCount();
    }, []);

    // Pie chart data for likes and dislikes
    const pieChartData = {
        labels: ["Likes", "Dislikes"],
        datasets: [
            {
                data: [feedbackData.totalLikes, feedbackData.totalDislikes],
                backgroundColor: ["#36A2EB", "#FF6384"], // Colors for likes and dislikes
                hoverBackgroundColor: ["#36A2EB", "#FF6384"],
            },
        ],
    };

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: "top",
            },
        },
    };

    // Prepare data for the line chart
    const feedbackMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const chartData = {
        labels: feedbackRatings.map(rating => feedbackMonths[rating._id - 1]), // Use month names
        datasets: [
            {
                label: 'Average Rating',
                data: feedbackRatings.map(rating => rating.averageRating), // Use average ratings from data
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4, // Smooth curve for the line
                pointRadius: 5, // Point radius size
                pointHoverRadius: 8, // Point hover effect
                borderWidth: 3, // Line thickness
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 5, // Rating out of 5 stars
                title: {
                    display: true,
                    text: 'Rating (Stars)',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Month',
                },
            },
        },
        plugins: {
            legend: {
                display: true,
            },
        },
        animation: {
            duration: 3000, // 3-second animation duration
            easing: 'easeInOutElastic', // Smooth and bouncy effect
            loop: false, // Animation runs once
        },
        elements: {
            line: {
                borderJoinStyle: 'round', // Rounded corner joins
            },
            point: {
                animation: {
                    duration: 2000, // Point appearance animation duration
                    easing: 'easeInOutBounce', // Bounce effect for points
                },
            },
        },
    };

    // Fetch event bookings from the backend
    useEffect(() => {
        const fetchRecentBookings = async () => {
            try {
                const response = await axios.get('/api/event/getRecentBookings'); // Fetch recent 5 bookings
                console.log('API Response:', response.data); // Log the API response to inspect the data
                setBookings(response.data.bookings); // Update the bookings state with the recent 5 bookings
            } catch (error) {
                console.error('Error fetching recent bookings:', error);
            }
        };

        fetchRecentBookings();
    }, []);




    // Calculate the percentage of each rating
    const totalRatings = ratingSummary.total;
    const getPercentage = (count) => (count / totalRatings) * 100;

    return (
        <div className="admin_dashboard_main_area">
            <div className="admin_dashboard_card_main_section">
                <div className="admin_dashboard_card card1">
                    <h1 style={{ fontSize: "30px" }}>Events</h1>
                    <h2>{eventCount}</h2> {/* Display total events count */}
                </div>
                <div className="admin_dashboard_card card2">
                    <h1 style={{ fontSize: "30px" }}>Employees</h1>
                    <h2 style={{ fontSize: "32px" }}>10</h2>
                    <Link to="/admin/bookings" style={{ textDecoration: "none" }}>
                        {/* Link content */}
                    </Link>
                </div>
                <div className="admin_dashboard_card card3">
                    <h1 style={{ fontSize: "30px" }}>Rooms</h1>
                    <h2>12</h2>
                    <Link to="/admin/inventorylist" style={{ textDecoration: "none" }}>
                        {/* Link content */}
                    </Link>
                </div>
                <div className="admin_dashboard_card card4">
                    <h1 style={{ fontSize: "30px" }}>Feedbacks</h1>
                    <h2>{feedbackCount}</h2>
                    <Link to="/admin/bookings" style={{ textDecoration: "none" }}>
                        {/* Link content */}
                    </Link>
                </div>
            </div>
            <div className="admin_dashboard_chart_section">
                <div className="admin_feedback_cart_section">
                    <div className="admin_dashboard_chart">
                        <h1 style={{ fontSize: "30px" }}>Feedback Ratings Over Time</h1>
                        <Line data={chartData} options={chartOptions} />
                        <div className="admin_panel_progress_rating_section">
                            <div className="rating_breakdown_container" style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "15px",
                                height: "200px",
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                marginTop: "2.6%",
                                marginLeft: "-3%",
                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" // Add this for shadow effect
                            }}>
                                {/* Left Side - Average Rating */}
                                <div className="average_rating" style={{
                                    textAlign: "center",
                                    padding: "10px",
                                    borderRight: "0.2px solid #ddd"
                                }}>
                                    <h1 style={{ fontSize: "40px" }}>{ratingSummary.average.toFixed(1)}</h1>
                                    <div style={{ fontSize: "24px", color: "#FFD700" }}>
                                        {Array(Math.round(ratingSummary.average))
                                            .fill()
                                            .map((_, i) => (
                                                <span key={i}>⭐</span>
                                            ))}
                                        {ratingSummary.average % 1 !== 0 && <span>⭐</span>}
                                    </div>
                                    <p style={{ color: "green" }}>All from verified</p>
                                </div>
                                {/* Right Side - Rating Breakdown */}
                                <div className="rating_breakdown" style={{ flex: 1, paddingLeft: "20px", marginLeft: "-10px" }}>
                                    {[5, 4, 3, 2, 1].map((star) => (
                                        <div
                                            key={star}
                                            style={{ display: "flex", alignItems: "center", marginBottom: "8px", marginLeft: "10px" }}
                                        >
                                            <span style={{ width: "50px", fontSize: "18px", color: "#FFD700" }}>
                                                {Array(star)
                                                    .fill()
                                                    .map((_, i) => (
                                                        <span key={i}>⭐</span>
                                                    ))}
                                            </span>
                                            <Progress
                                                percent={getPercentage(ratingSummary.ratings.find(rating => rating._id === star)?.count || 0)}
                                                showInfo={false}
                                                strokeColor={star === 5 ? "#52c41a" : "#d9d9d9"}
                                                style={{ width: "200px", marginLeft: "73px" }}
                                            />
                                            <span style={{ marginLeft: "10px" }}>
                                                {ratingSummary.ratings.find(rating => rating._id === star)?.count || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Pie Chart for likes and dislikes */}
                    <div
                        style={{
                            padding: "20px",
                            borderRadius: "8px",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Add shadow
                            marginBottom: "20px", // Space between sections
                            textAlign: "center", // Center the chart
                            width: "950px", 
                            height: "600px",// Adjust width if necessary
                            maxWidth: "500px", // Set a max width for the chart container
                            margin: "2% 1% 0% ", // Center align the chart container
                        }}
                    >
                        <h1
                            style={{
                                fontSize: "30px",
                                marginBottom: "20px",
                                color: "#333",
                                textAlign: "right", // Align the heading to the right
                            }}
                        >
                            Feedback Like & Dislike 
                        </h1>
                        <Pie data={pieChartData} options={pieChartOptions} />
                    </div>

                </div>
            </div>
            <div className="booking_table_admin_show">
                <div className="booking_table_admin_show">
                    <div className="booking_table_admin_show">
                        <div className="booking_table_admin_show">
                            <div style={{
                                padding: "20px",
                                borderRadius: "8px",
                                width: "100%",
                                margin: "0 auto",
                                marginTop:"5px"
                            }}>
                                <h2 style={{ marginBottom: "10px", fontSize: "20px" }}>Recent Event Bookings</h2>
                                <table style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    backgroundColor: "#fff",
                                    marginTop: "5px",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                    fontSize: "14px" // Small font for compact table
                                }}>
                                    <thead style={{ backgroundColor: "#e8f0fb", textAlign: "left" }}>
                                        <tr>
                                            <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Guest Name</th>
                                            <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Guest Email</th>
                                            <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Phone</th>
                                            <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Event Date</th>
                                            <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.length > 0 ? bookings.map((booking, index) => (
                                            <tr key={index}>
                                                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{booking.guestName}</td>
                                                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{booking.guestEmail}</td>
                                                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{booking.guestPhone}</td>
                                                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{new Date(booking.eventDate).toDateString()}</td>
                                                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}> LKR {booking.totalAmount}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" style={{ padding: "12px", textAlign: "center" }}>No recent bookings found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
