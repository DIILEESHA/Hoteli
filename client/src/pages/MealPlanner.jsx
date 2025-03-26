import React, { useState, useEffect } from "react";
import { Modal, Button, Select, DatePicker, Table, message, Spin, Popconfirm } from "antd";
import moment from "moment";
import axios from "axios";

const { Option } = Select;

function MealPlanner({ visible, onClose, customerID }) {
  const [mealPlan, setMealPlan] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPlan, setFetchingPlan] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (visible && customerID) {
      fetchExistingMealPlan();
    }
  }, [visible, customerID]);

  const fetchExistingMealPlan = async () => {
    setFetchingPlan(true);
    try {
      const response = await axios.get(`/api/order/mealPlan/${customerID}`);
      if (response.data && response.data.mealPlan) {
        setMealPlan(response.data.mealPlan);
        setMeals(response.data.meals);
      } else {
        setMealPlan([]);
        setMeals(response.data.meals);
      }
    } catch (error) {
      console.error("Error fetching existing meal plan:", error);
      message.error("Failed to fetch existing meal plan. Please try again.");
      setMealPlan([]);
      setMeals([]);
    } finally {
      setFetchingPlan(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleAddDay = () => {
    if (!selectedDate) {
      message.error("Please select a date before adding a day.");
      return;
    }

    const formattedDate = selectedDate.format("YYYY-MM-DD");

    if (mealPlan.find((day) => day.date === formattedDate)) {
      message.error("Meal plan for this date already exists.");
      return;
    }

    setMealPlan((prevPlan) => [
      ...prevPlan,
      {
        date: formattedDate,
        breakfast: "",
        lunch: "",
        dinner: "",
      },
    ]);
    setSelectedDate(null); // Reset the selected date
  };

  const handleMealSelection = (date, mealType, mealId) => {
    setMealPlan((prevPlan) =>
      prevPlan.map((day) =>
        day.date === date ? { ...day, [mealType]: mealId } : day
      )
    );
  };

  const handleDeleteMealPlan = (date) => {
    setMealPlan((prevPlan) => prevPlan.filter((day) => day.date !== date));
    message.success(`Meal plan for ${date} deleted.`);
  };

  const handleSavePlan = async () => {
    setLoading(true);
    try {
      await axios.post("/api/order/mealPlan", {
        customerID,
        mealPlan,
      });
      message.success("Meal plan saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving meal plan:", error);
      message.error("Failed to save meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => moment(text).format("YYYY-MM-DD"),
    },
    {
      title: "Breakfast",
      dataIndex: "breakfast",
      key: "breakfast",
      render: (value, record) => (
        <Select
          style={{ width: 120 }}
          onChange={(value) =>
            handleMealSelection(record.date, "breakfast", value)
          }
          value={value || undefined}
        >
          <Option value="">Select meal</Option>
          {meals
            .filter((meal) => meal.category === "breakfast")
            .map((meal) => (
              <Option key={meal._id} value={meal._id}>
                {meal.name}
              </Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Lunch",
      dataIndex: "lunch",
      key: "lunch",
      render: (value, record) => (
        <Select
          style={{ width: 120 }}
          onChange={(value) => handleMealSelection(record.date, "lunch", value)}
          value={value || undefined}
        >
          <Option value="">Select meal</Option>
          {meals
            .filter((meal) => meal.category === "lunch")
            .map((meal) => (
              <Option key={meal._id} value={meal._id}>
                {meal.name}
              </Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Dinner",
      dataIndex: "dinner",
      key: "dinner",
      render: (value, record) => (
        <Select
          style={{ width: 120 }}
          onChange={(value) =>
            handleMealSelection(record.date, "dinner", value)
          }
          value={value || undefined}
        >
          <Option value="">Select meal</Option>
          {meals
            .filter((meal) => meal.category === "dinner")
            .map((meal) => (
              <Option key={meal._id} value={meal._id}>
                {meal.name}
              </Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Popconfirm
          title={`Are you sure you want to delete the meal plan for ${record.date}?`}
          onConfirm={() => handleDeleteMealPlan(record.date)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="danger">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title="Meal Planner"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSavePlan}
          loading={loading}
          disabled={mealPlan.length === 0}
        >
          Save Meal Plan
        </Button>,
      ]}
    >
      <Spin spinning={fetchingPlan}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            placeholder="Select a date"
            style={{ marginRight: 8 }}
          />
          <Button type="primary" onClick={handleAddDay}>
            Add Day
          </Button>
        </div>

        {meals.length === 0 ? (
          <p>No meals available. Please add meals to the system first.</p>
        ) : (
          <Table
            columns={columns}
            dataSource={mealPlan}
            rowKey="date"
            pagination={false}
          />
        )}
      </Spin>
    </Modal>
  );
}

export default MealPlanner;
