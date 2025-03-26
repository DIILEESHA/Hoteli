import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function EventListPage() {
    // State to store events data
    const [events, setEvents] = useState([]);
    // State to indicate loading status
    const [loading, setLoading] = useState(true);
    // State to store error messages
    const [error, setError] = useState(null);
    // State for search input
    const [searchTerm, setSearchTerm] = useState('');
    // Hook to programmatically navigate to other routes
    const navigate = useNavigate();

    // Fetch events when the component mounts or searchTerm changes
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Make a GET request to fetch events with the search term as a query parameter
                const response = await axios.get('/api/event/getEvents', {
                    params: { search: searchTerm }
                });
                console.log('Response data:', response.data); // Log response data for debugging

                // Check if the response data is in the expected format
                if (response.data && Array.isArray(response.data.events)) {
                    setEvents(response.data.events); // Update state with fetched events
                } else {
                    console.warn('Unexpected response structure:', response.data);
                }
                setLoading(false); // Set loading to false once data is fetched
            } catch (error) {
                console.error('Error fetching events:', error);
                setError('Failed to fetch events'); // Set error message if fetching fails
                setLoading(false); // Set loading to false in case of an error
            }
        };

        fetchEvents(); // Trigger the fetch function
    }, [searchTerm]); // Dependency array: re-fetch when searchTerm changes

    // Update searchTerm state when search input changes
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Navigate to the event details page when "More Info" button is clicked
    const handleMoreInfo = (id) => {
        navigate(`/events/${id}`);
    };

    return (
        <div>
            <h1 style={{marginLeft:30}}>Our Events</h1>
            <hr />
            <div className="event-list">
                {/* Search input */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search ..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        style={{
                            padding: '8px',
                            marginRight: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                {/* Conditional rendering based on loading and error state */}
                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    events.length > 0 ? (
                        events.map((event) => (
                            <div className="event" key={event.eventId}>
                                {/* Event image */}
                                <img src={event.baseImage} alt={event.eventName} />
                                <div className="event-details">
                                    <h2>{event.eventName}</h2>
                                    <p>Type: {event.eventType}</p>
                                    <p>Price: Rs {event.price}</p>
                                    {/* Render facilities if available */}
                                    <div className="event-icons">
                                        {(Array.isArray(event.facilities) ? event.facilities : []).map((icon, index) => (
                                            <span key={index}>{icon}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="event-price">
                                    <p>From</p>
                                    <p>Rs: {event.price}</p>
                                    {/* Button to show more information about the event */}
                                    <button onClick={() => handleMoreInfo(event.eventId)}>More Info</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No events available.</p>
                    )
                )}
            </div>
        </div>
    );
}

export default EventListPage;
