import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Input, Rate, Pagination, message } from 'antd';
import { LikeOutlined, DislikeOutlined, LikeFilled, DislikeFilled } from '@ant-design/icons';
import axios from 'axios';

const FeedbackPage = () => {

    const [userID, setUserID] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(9); // Show 9 feedbacks at a time
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [visibleAdd, setVisibleAdd] = useState(false);
    const [visibleEdit, setVisibleEdit] = useState(false);
    const [visibleDelete, setVisibleDelete] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState(null);

    // Fetch user ID from local storage
    const fetchUserByID = useCallback(() => {
        const userJSON = localStorage.getItem("currentUser");
        if (!userJSON) {
            console.error("User not found in localStorage.");
            return;
        }
        const user = JSON.parse(userJSON);
        setUserID(user.userID); // Retrieve and set userID
    }, []);

    useEffect(() => {
        fetchUserByID();
    }, [fetchUserByID]);

    useEffect(() => {
        fetchFeedbacks();
    }, [page, search]);

    const fetchFeedbacks = async () => {
        try {
            const { data } = await axios.post('/api/feedback/searchFeedback', {
                search,
                page,
                limit
            });
            setFeedbacks(data.feedbacks);
            setTotal(data.total);
        } catch (error) {
            message.error('Error fetching feedbacks');
        }
    };

    const handleAddFeedback = async (values) => {
        try {
            console.log("Submitting feedback with values:", values);
            console.log("User ID:", userID);
            const feedbackData = { ...values, userID };
            console.log("Feedback Data being sent:", feedbackData);
            const response = await axios.post('/api/feedback/addFeedback', feedbackData);
            console.log("Response data:", response.data);

            if (response.status === 201) {
                message.success('Feedback added successfully');
                fetchFeedbacks();
                setVisibleAdd(false);
            } else {
                message.error('Failed to add feedback');
            }
        } catch (error) {
            console.error("Error in handleAddFeedback:", error.response ? error.response.data : error.message);
            message.error('Error adding feedback');
        }
    };

    const handleEditFeedback = async (values) => {
        try {
            await axios.post('/api/feedback/updateFeedback', { feedbackID: currentFeedback._id, ...values });
            message.success('Feedback updated successfully');
            fetchFeedbacks();
            setVisibleEdit(false);
        } catch (error) {
            message.error('Error updating feedback');
        }
    };

    const handleDeleteFeedback = async () => {
        try {
            await axios.post('/api/feedback/deleteFeedback', { feedbackID: currentFeedback._id });
            message.success('Feedback deleted successfully');
            fetchFeedbacks();
            setVisibleDelete(false);
        } catch (error) {
            message.error('Error deleting feedback');
        }
    };

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearch(value);
        setPage(1);
    };

    // Like a feedback
    const handleLike = async (feedbackID) => {
        try {
            const { data } = await axios.post(`/api/feedback/${feedbackID}/like`, { userID });
            setFeedbacks(feedbacks.map(feedback => feedback._id === feedbackID ? data.feedback : feedback));
        } catch (error) {
            message.error('Error liking feedback');
        }
    };



    // Dislike a feedback
    const handleDislike = async (feedbackID) => {
        try {
            const { data } = await axios.post(`/api/feedback/${feedbackID}/dislike`, { userID });
            setFeedbacks(feedbacks.map(feedback => feedback._id === feedbackID ? data.feedback : feedback));
        } catch (error) {
            message.error('Error disliking feedback');
        }
    };

    return (
        <div className="feedback-page-6789">
            <h1 style={{ marginBottom: 20, marginLeft: 5 }}>Feedbacks..</h1>
            <hr />
            <div className="feedback-header-6789">
                <Input.Search
                    placeholder="Search"
                    value={search}
                    onChange={handleSearch}
                    style={{ width: 300 }}
                />
                <Button type="primary" style={{ backgroundColor: '#25b05f' }} onClick={() => setVisibleAdd(true)}>
                    Add Feedback
                </Button>
            </div>
            <div className="feedback-list-6789">
                {feedbacks.map(feedback => {
                    console.log(feedback._id); // This will log the feedback ID to the console

                    return (
                        <div key={feedback._id} className="feedback-card-6789">
                            <h3>{feedback.title}</h3>
                            <p>
                                <strong>{feedback.username}</strong>
                            </p>
                            <p>{feedback.description}</p>
                            <Rate disabled defaultValue={feedback.rating} />
                            <div style={{ marginTop: 10 }}>
                                <Button
                                    type="text"
                                    icon={feedback.likedBy.includes(userID) ? <LikeFilled /> : <LikeOutlined />}
                                    onClick={() => {
                                        handleLike(feedback._id);  // Ensure feedback._id is passed correctly
                                    }}
                                    style={{ color: feedback.likedBy.includes(userID) ? '#1890ff' : 'inherit', marginRight: 8 }}
                                    disabled={!userID}  // Disable the button if userID is null or undefined
                                >
                                    Like {feedback.likes}
                                </Button>
                                <Button
                                    type="text"
                                    icon={feedback.dislikedBy.includes(userID) ? <DislikeFilled /> : <DislikeOutlined />}
                                    onClick={() => {
                                        handleDislike(feedback._id);  // Ensure feedback._id is passed correctly
                                    }}
                                    style={{ color: feedback.dislikedBy.includes(userID) ? '#ff4d4f' : 'inherit' }}
                                    disabled={!userID}  // Disable the button if userID is null or undefined
                                >
                                    Dislike {feedback.dislikes}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <Pagination
                current={page}
                pageSize={limit} // Shows 9 cards per page
                total={total}
                onChange={setPage}
                style={{ textAlign: 'center', marginTop: '20px' }}
            />
            <AddFeedbackModal
                visible={visibleAdd}
                onCancel={() => setVisibleAdd(false)}
                onSubmit={handleAddFeedback}
                userID={userID}
            />
            <EditFeedbackModal
                visible={visibleEdit}
                onCancel={() => setVisibleEdit(false)}
                onSubmit={handleEditFeedback}
                feedback={currentFeedback}
            />
            <DeleteFeedbackModal
                visible={visibleDelete}
                onCancel={() => setVisibleDelete(false)}
                onConfirm={handleDeleteFeedback}
            />
        </div>
    );
};



const AddFeedbackModal = ({ visible, onCancel, onSubmit, userID }) => {
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState('');

    // Reset form fields when modal is closed
    useEffect(() => {
        if (!visible) {
            setTitle('');
            setUsername('');
            setRating(0);
            setDescription('');
        }
    }, [visible]);

    const handleSubmit = () => {
        if (!title || !username || rating === 0 || !description || !userID) {
            message.error('Please fill in all fields');
            return;
        }
        const feedbackData = { title, username, rating, description, userID };
        onSubmit(feedbackData);
    };

    return (
        <Modal
            title="Add Feedback"
            visible={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText="Save"
        >
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginTop: '10px' }} />
            <Rate value={rating} onChange={setRating} style={{ marginTop: '10px' }} />
            <Input.TextArea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginTop: '10px' }} />
        </Modal>
    );
};

const EditFeedbackModal = ({ visible, onCancel, onSubmit, feedback }) => {
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState('');

    // Reset form fields when feedback changes
    useEffect(() => {
        if (feedback) {
            setTitle(feedback.title || '');
            setUsername(feedback.username || '');
            setRating(feedback.rating || 0);
            setDescription(feedback.description || '');
        }
    }, [feedback]);

    const handleSubmit = () => {
        if (!title || !username || rating === 0 || !description) {
            message.error('Please fill in all fields');
            return;
        }
        onSubmit({ title, username, rating, description });
    };

    return (
        <Modal
            title="Edit Feedback"
            visible={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText="Update"
        >
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginTop: '10px' }} />
            <Rate value={rating} onChange={setRating} style={{ marginTop: '10px' }} />
            <Input.TextArea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginTop: '10px' }} />
        </Modal>
    );
};

const DeleteFeedbackModal = ({ visible, onCancel, onConfirm }) => (
    <Modal
        title="Delete Feedback"
        visible={visible}
        onCancel={onCancel}
        onOk={onConfirm}
        okText="Delete"
        okButtonProps={{ danger: true }}
    >
        <p>Are you sure you want to delete this feedback?</p>
    </Modal>
);

export default FeedbackPage;
