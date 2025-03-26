import React, { useEffect, useState } from "react";
import { Table, Button } from "antd";
import axios from "axios";
import { CSVLink } from "react-csv";
import { AiFillPrinter } from "react-icons/ai";

function ManageFeedbacks() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [allFeedbacks, setAllFeedbacks] = useState([]); // New state for all feedbacks
    const limit = 7;

    useEffect(() => {
        fetchFeedbacks(page);
        fetchAllFeedbacks(); // Fetch all feedbacks for CSV
    }, [page]);

    const fetchFeedbacks = async (page) => {
        setLoading(true);
        try {
            const response = await axios.post("/api/feedback/getFeedback", { page, limit });
            setFeedbacks(response.data.feedbacks);
            setTotal(response.data.total);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
            setLoading(false);
        }
    };

    // New function to fetch all feedbacks (without pagination)
    const fetchAllFeedbacks = async () => {
        try {
            const response = await axios.post("/api/feedback/getFeedback", { page: 1, limit: 0 }); // limit: 0 means fetch all
            setAllFeedbacks(response.data.feedbacks); // Store all feedbacks for CSV download
        } catch (error) {
            console.error("Error fetching all feedbacks:", error);
        }
    };

    const columns = [
        {
            title: "Feedback ID",
            dataIndex: "_id",
            key: "_id",
            render: (text) => (
                text.length > 15 ? `${text.substring(0, 15)}...` : text // Show first 10 characters, then "..."
            ),
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
        },
        {
            title: "User ID",
            dataIndex: "userID",
            key: "userID",
        },
        {
            title: "Rating",
            dataIndex: "rating",
            key: "rating",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text) => (
                text.length > 30 ? `${text.substring(0, 30)}...` : text // Show first 30 characters, then "..."
            ),
        },
        {
            title: "Timestamp",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => new Date(text).toLocaleString(),
        },
    ];

    return (
        <div className="manage_feedback_main_container_admin_123">
            <h1>Manage Feedbacks</h1>
            <div className="csv_button_container_123">
                <Button type="primary" className="csv_button_admin_123">
                    <CSVLink
                        data={allFeedbacks.map(feedback => ({
                            FeedbackID: feedback._id,  // Adding Feedback ID to CSV data
                            Title: feedback.title,
                            Username: feedback.username,
                            UserID: feedback.userID,
                            Rating: feedback.rating,
                            Description: feedback.description,
                            Timestamp: new Date(feedback.createdAt).toLocaleString(),
                        }))}
                        filename={"feedbacks.csv"}
                        style={{ textDecoration: 'none', color: 'inherit' }} // Inline styles to remove underline
                    >
                        Export <AiFillPrinter style={{ marginLeft: '8px' }} /> {/* Inline style for spacing icon */}
                    </CSVLink>
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={feedbacks} // Still use paginated feedbacks for table
                loading={loading}
                pagination={{
                    current: page,
                    total: total,
                    pageSize: limit,
                    onChange: (page) => setPage(page),
                }}
                rowKey="_id"
            />
        </div>
    );
}

export default ManageFeedbacks;
