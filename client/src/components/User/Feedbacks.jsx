import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Input, Rate, Pagination, message } from 'antd';
import axios from 'axios';

function Feedbacks() {

    const [userID, setUserID] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(2); 
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [visibleAdd, setVisibleAdd] = useState(false);
    const [visibleEdit, setVisibleEdit] = useState(false);
    const [visibleDelete, setVisibleDelete] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState(null);

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
    }, []);

    useEffect(() => {
        if (userID) {
            fetchFeedbacks();
        }
    }, [page, search, userID]);

    const fetchFeedbacks = async () => {
        console.log("Fetching feedbacks for userID:", userID); // Add logging
        if (!userID) {
            message.error('User ID not available');
            return;
        }
        try {
            const { data } = await axios.post('/api/feedback/getFeedbackByUserId', {
                search,
                page,
                limit,
                userID
            });
            console.log("Feedbacks fetched:", data.feedbacks); // Log fetched feedbacks
            setFeedbacks(data.feedbacks);
            setTotal(data.total);
        } catch (error) {
            console.error("Error fetching feedbacks:", error); // Log error details
            message.error('Error fetching feedbacks');
        }
    };

    const handleAddFeedback = async (values) => {
        try {
            const feedbackData = { ...values, userID };
            const response = await axios.post('/api/feedback/addFeedback', feedbackData);

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

    return <div>
        <div className="feedback-page-6789">
            <div className="feedback-header-6789">
            <h2>Your Feedbacks</h2>
                <Button type="primary" style={{ backgroundColor: '#25b05f'}} onClick={() => setVisibleAdd(true)}>
                    Add Feedback
                </Button>
            </div>
            <div className="feedback-list-pofile-6789">
                {feedbacks.map((feedback) => (
                    <div key={feedback._id} className="feedback-card-6789">
                        <h3>{feedback.title}</h3>
                        <p><strong>{feedback.username}</strong></p>
                        <p>{feedback.description}</p>
                        <Rate disabled defaultValue={feedback.rating} />
                        <div className="feedback-actions-6789">
                            <Button onClick={() => { setCurrentFeedback(feedback); setVisibleEdit(true); }}>Edit</Button>
                            <Button danger onClick={() => { setCurrentFeedback(feedback); setVisibleDelete(true); }}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            <Pagination
                current={page}
                pageSize={limit}
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
    </div>;
}

const AddFeedbackModal = ({ visible, onCancel, onSubmit, userID }) => {
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState('');

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


export default Feedbacks;
