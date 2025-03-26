import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { message, Radio, TimePicker, Tag, Tooltip } from "antd";
import moment from "moment";
import { Spin } from "antd";
import DynamicTimeSlotAvailability from './DynamicTimeSlotAvailability';


function MealOrderPage() {
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerID, setCustomerID] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [orderType, setOrderType] = useState("delivery");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pickupTime, setPickupTime] = useState(null);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState(0);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [peakHourSurcharge, setPeakHourSurcharge] = useState(0);
  const navigate = useNavigate();
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);


  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await axios.get("/api/catering/getItems");
        const mealsData = response.data || [];
        setMeals(mealsData);
        setFilteredMeals(mealsData);
      } catch (error) {
        console.error("Error fetching meals:", error);
        setMeals([]);
        setFilteredMeals([]);
      }
    };

    fetchMeals();
    fetchAvailableTimeSlots();

    const storedCustomer = localStorage.getItem("currentUser");
    if (storedCustomer) {
      const userObject = JSON.parse(storedCustomer);
      setCustomerID(userObject.userID);
    }
  }, []);

  useEffect(() => {
    calculateEstimatedPrepTime();
  }, [selectedMeals]);

  useEffect(() => {
    calculatePeakHourSurcharge();
  }, [pickupTime]);

  const fetchAvailableTimeSlots = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/order/availableTimeSlots");
      setAvailableTimeSlots(response.data);
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      message.error("Failed to fetch available time slots");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotSelect = (time) => {
    setSelectedTimeSlot(time);
    setPickupTime(moment(time, 'HH:mm'));
  };

  // Update the time slot rendering in your JSX
  const renderTimeSlots = () => (
    <div className="time-slot-availability">
      <h4>Time Slot Availability:</h4>
      {availableTimeSlots.map((slot, index) => (
        <Tooltip
          key={index}
          title={
            slot.isPast
              ? "This time slot has passed"
              : `${slot.availability} slots available
                 Estimated prep time: ${slot.estimatedPrepTime} minutes`
          }
        >
          <Tag
            color={
              slot.isPast ? "gray" : slot.availability > 0 ? "green" : "red"
            }
          >
            {slot.time} -{" "}
            {slot.isPast
              ? "Passed"
              : slot.availability > 0
              ? "Available"
              : "Full"}
          </Tag>
        </Tooltip>
      ))}
    </div>
  );

  const disabledHours = () => {
    const currentHour = moment().hour();
    return Array.from({ length: currentHour + 1 }, (_, i) => i);
  };

  const disabledMinutes = (selectedHour) => {
    if (selectedHour === moment().hour()) {
      return Array.from({ length: moment().minute() + 1 }, (_, i) => i);
    }
    return [];
  };

  // Use this in your component's return statement where appropriate
  // eslint-disable-next-line no-lone-blocks
  {
    orderType === "takeaway" && (
      <div className="quick-pickup">
        <h3>Quick Pick-up</h3>
        {loading ? (
          <Spin tip="Loading available time slots..." />
        ) : (
          renderTimeSlots()
        )}
        <TimePicker
          format="HH:mm"
          minuteStep={30}
          disabledHours={disabledHours}
          disabledMinutes={disabledMinutes}
          onChange={(time) => setPickupTime(time)}
          className="pickup-time-picker"
        />
      </div>
    );
  }

  const calculateEstimatedPrepTime = () => {
    const totalPrepTime = selectedMeals.reduce(
      (total, meal) => total + (meal.prepTime || 10),
      0
    );
    setEstimatedPrepTime(totalPrepTime);
  };

  const calculatePeakHourSurcharge = () => {
    if (!pickupTime) return;
    const hour = pickupTime.hour();
    // Define peak hours (e.g., 12 PM to 2 PM)
    if (hour >= 12 && hour < 14) {
      setPeakHourSurcharge(totalAmount * 0.1); // 10% surcharge during peak hours
    } else {
      setPeakHourSurcharge(0);
    }
  };

  const handleFilter = (filter) => {
    if (filter === "All") {
      setFilteredMeals(meals);
    } else {
      const filtered = meals.filter((meal) => meal.type === filter);
      setFilteredMeals(filtered);
    }
  };

  const handleSelectMeal = (meal) => {
    setSelectedMeals([...selectedMeals, meal]);
    setTotalAmount(totalAmount + Number(meal.price));
  };

  const handleRemoveMeal = (index) => {
    const updatedMeals = [...selectedMeals];
    const removedMeal = updatedMeals.splice(index, 1)[0];
    setSelectedMeals(updatedMeals);
    setTotalAmount(totalAmount - Number(removedMeal.price));
  };

  const handlePlaceOrder = async () => {
    if (
      !customerName ||
      !customerID ||
      selectedMeals.length === 0 ||
      !phoneNumber
    ) {
      message.error(
        "Please provide all required details and select meals to place an order."
      );
      return;
    }

    if (orderType === "delivery" && (!street || !city || !state || !zipCode)) {
      message.error("Please provide complete delivery address.");
      return;
    }

    if (orderType === "takeaway" && !selectedTimeSlot) {
      message.error("Please select a pick-up time for take-away orders.");
      return;
    }

    const orderData = {
      customerName,
      customerID,
      phoneNumber,
      address:
        orderType === "delivery"
          ? {
              street,
              city,
              state,
              zipCode,
            }
          : null,
      meals: selectedMeals.map((meal) => ({
        name: meal.name,
        price: meal.price,
        specialInstructions: "", // This could be added if your UI supports it
      })),
      orderType,
      totalAmount: totalAmount + peakHourSurcharge,
      scheduledDeliveryTime:
        orderType === "takeaway" ? moment(selectedTimeSlot, 'HH:mm').toDate() : null,
      status: "Pending",
    };

    try {
      const response = await axios.post("/api/order/addOrdertakeaway", orderData);
      message.success("Order placed successfully!");
      navigate("/", {
        state: { orderDetails: response.data },
      });
    } catch (error) {
      console.error("Error placing order:", error);
      message.error("Failed to place order. Please try again.");
    }
  };

  



  return (
    <div className="order-container">
      <h1>Order Your Meal</h1>
      <hr />
      <div className="filter-bar">
        <button onClick={() => handleFilter("vegi")}>Vegetarian</button>
        <button onClick={() => handleFilter("non vegi")}>Non-Vegetarian</button>
        <button onClick={() => handleFilter("All")}>All</button>
      </div>
      <div className="meal-list">
        {filteredMeals.map((meal, index) => (
          <div className="meal-card" key={index}>
            <img src={meal.imageUrl} alt={meal.name} className="meal-image" />
            <div className="meal-details">
              <h2>{meal.name}</h2>
              <p>{meal.description}</p>
              <p>Type: {meal.type}</p>
              <p>Price: Rs. {meal.price}</p>
              <p>Prep Time: {meal.prepTime || 10} minutes</p>
              <button
                className="order-button"
                onClick={() => handleSelectMeal(meal)}
              >
                Add to Order
              </button>
            </div>
          </div>
        ))}
      </div>
      <hr />
      <div className="order-summary">
        <h2>Your Order</h2>
        {selectedMeals.map((meal, index) => (
          <div className="order-item" key={index}>
            <p>
              {meal.name} - Rs. {meal.price} ({meal.type})
            </p>
            <button
              className="remove-button"
              onClick={() => handleRemoveMeal(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <h3>Subtotal: Rs. {totalAmount}</h3>
        {peakHourSurcharge > 0 && (
          <p>Peak Hour Surcharge: Rs. {peakHourSurcharge.toFixed(2)}</p>
        )}
        <h3>Total: Rs. {(totalAmount + peakHourSurcharge).toFixed(2)}</h3>
        <div className="order-type">
          <Radio.Group
            onChange={(e) => setOrderType(e.target.value)}
            value={orderType}
          >
            <Radio value="delivery">Delivery</Radio>
            <Radio value="takeaway">Take-away</Radio>
          </Radio.Group>
        </div>
        {orderType === "takeaway" && (
        <div className="quick-pickup">
          <h3>Quick Pick-up</h3>
          <DynamicTimeSlotAvailability onTimeSlotSelect={handleTimeSlotSelect} />
          {selectedTimeSlot && (
            <p>Selected pick-up time: {selectedTimeSlot}</p>
          )}
        </div>
      )}
        <div className="customer-details">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input-field"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="input-field"
            pattern="[0-9]{10}"
            title="Phone number must be exactly 10 digits"
            required
          />
          {orderType === "delivery" && (
            <div>
              <input
                type="text"
                placeholder="Street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Zip Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="input-field"
                required
              />
            </div>
          )}
          <input
            type="text"
            placeholder="Customer ID"
            value={customerID}
            onChange={(e) => setCustomerID(e.target.value)}
            className="input-field"
            disabled
            style={{ marginTop: 10 }}
          />
        </div>
        <button className="place-order-button" onClick={handlePlaceOrder}>
          Place Order
        </button>
      </div>
    </div>
  );
}

export default MealOrderPage;
