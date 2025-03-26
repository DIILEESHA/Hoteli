import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { message, Modal, Input, DatePicker, TimePicker } from "antd";
import moment from "moment";
import MealPlanner from "./MealPlanner";

function MealOrderPage() {
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerID, setCustomerID] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [customizationModal, setCustomizationModal] = useState({
    visible: false,
    mealIndex: null,
  });
  const [customizations, setCustomizations] = useState({});
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [showMealPlanner, setShowMealPlanner] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    console.log("Meals passed to MealPlanner:", meals);
  }, [meals]);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await axios.get("/api/catering/getItems");
        const mealsData = response.data || [];
        setMeals(mealsData);
        setFilteredMeals(mealsData);
        console.log("Fetched meals:", mealsData);
      } catch (error) {
        console.error("Error fetching meals:", error);
        message.error("Failed to fetch meals. Please try again.");
        setMeals([]);
        setFilteredMeals([]);
      }
    };

    fetchMeals();

    const storedCustomer = localStorage.getItem("currentUser");
    if (storedCustomer) {
      const userObject = JSON.parse(storedCustomer);
      setCustomerID(userObject.userID);
      setCustomerName(userObject.name || "");
      console.log("Customer ID:", userObject.userID);
    }
  }, []);

  const handleFilter = (filter) => {
    if (filter === "All") {
      setFilteredMeals(meals);
    } else {
      const filtered = meals.filter((meal) => meal.type === filter);
      setFilteredMeals(filtered);
    }
  };

  const handleSelectMeal = (meal) => {
    setSelectedMeals([...selectedMeals, { ...meal, specialInstructions: "" }]);
    setTotalAmount(totalAmount + Number(meal.price));
  };

  const handleRemoveMeal = (index) => {
    const updatedMeals = [...selectedMeals];
    const removedMeal = updatedMeals.splice(index, 1)[0];
    setSelectedMeals(updatedMeals);
    setTotalAmount(totalAmount - Number(removedMeal.price));
  };

  const handleCustomize = (index) => {
    setCustomizationModal({ visible: true, mealIndex: index });
  };

  const handleCustomizationSave = () => {
    const updatedMeals = [...selectedMeals];
    updatedMeals[customizationModal.mealIndex].specialInstructions =
      customizations[customizationModal.mealIndex] || "";
    setSelectedMeals(updatedMeals);
    setCustomizationModal({ visible: false, mealIndex: null });
  };

  const handlePlaceOrder = async () => {
    if (
      !customerName ||
      !customerID ||
      !roomNumber ||
      selectedMeals.length === 0
    ) {
      message.error("Please fill in all details and select at least one meal.");
      return;
    }
  
    let scheduledDeliveryTime = null;
    if (scheduledDate && scheduledTime) {
      scheduledDeliveryTime = moment(scheduledDate)
        .hour(scheduledTime.hour())
        .minute(scheduledTime.minute())
        .toDate();
    }
  
    const orderData = {
      purchaseDate: new Date().toLocaleDateString(),
      customerName,
      customerID,
      roomNumber,
      amount: totalAmount,
      meals: selectedMeals,  // Send entire meal objects instead of just names
      scheduledDeliveryTime,
    };
  
    try {
      const response = await axios.post("/api/order/addOrder", orderData);
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
      <h1>Order Your Meal for Room</h1>
      <hr />
      <div className="filter-bar">
        <button onClick={() => handleFilter("vegi")}>Vegetarian</button>
        <button onClick={() => handleFilter("non vegi")}>Non-Vegetarian</button>
        <button onClick={() => handleFilter("All")}>All</button>
        <button onClick={() => setShowMealPlanner(true)}>
          Open Meal Planner
        </button>
      </div>

      <div className="meal-list">
        {filteredMeals.map((meal) => (
          <div className="meal-card" key={meal._id}>
            <img src={meal.imageUrl} alt={meal.name} />
            <div className="meal-details">
              <h2>{meal.name}</h2>
              <p>{meal.description}</p>
              <p>Price: Rs. {meal.price}</p>
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
              {meal.name} - Rs. {meal.price}
              {meal.specialInstructions && (
                <span> (Special: {meal.specialInstructions})</span>
              )}
            </p>
            <button
              style={{
                backgroundColor: "#4CAF50", // Green background
                color: "white", // White text
                padding: "10px 20px", // Padding around the button
                border: "none", // No border
                borderRadius: "5px", // Rounded corners
                cursor: "pointer", // Pointer cursor on hover
                fontSize: "16px", // Font size
            
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow
              }}
              onClick={() => handleCustomize(index)}
            >
              Customize
            </button>

            <button
              className="remove-button"
              onClick={() => handleRemoveMeal(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <h3>Total: Rs. {totalAmount}</h3>
        <div className="customer-details">
          <Input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input-field"
          />
          <Input
            placeholder="Customer ID"
            value={customerID}
            onChange={(e) => setCustomerID(e.target.value)}
            className="input-field"
            disabled
          />
          <Input
            placeholder="Room Number"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="schedule-order">
          <h3>Schedule Order (Optional)</h3>
          <DatePicker
            onChange={(date) => setScheduledDate(date)}
            className="input-field"
          />
          <TimePicker
            onChange={(time) => setScheduledTime(time)}
            format="HH:mm"
            className="input-field"
          />
        </div>
        <button className="place-order-button" onClick={handlePlaceOrder}>
          Place Order
        </button>
      </div>
      <MealPlanner
        visible={showMealPlanner}
        onClose={() => setShowMealPlanner(false)}
        meals={meals} // Pass entire meal objects instead of just names
        customerID={customerID}
      />

      <Modal
        title="Customize Your Meal"
        open={customizationModal.visible}
        onOk={handleCustomizationSave}
        onCancel={() =>
          setCustomizationModal({ visible: false, mealIndex: null })
        }
      >
        <Input.TextArea
          placeholder="Enter your special instructions or customizations"
          value={customizations[customizationModal.mealIndex] || ""}
          onChange={(e) =>
            setCustomizations({
              ...customizations,
              [customizationModal.mealIndex]: e.target.value,
            })
          }
        />
      </Modal>
    </div>
  );
}

export default MealOrderPage;
