import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Modal, Form, Input, Button, DatePicker, message } from "antd";
import moment from "moment";
import packageImg from "../assets/Images/packageImg.jpg";

function PackageViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pkg, setPkg] = useState(null);
  const [basePrice, setBasePrice] = useState(0); // Base price per night
  const [discountAmount, setDiscountAmount] = useState(0); // Discount amount per night
  const [totalPrice, setTotalPrice] = useState(0); // Total price with nights calculation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]); // Store selected dates
  const [nights, setNights] = useState(1); // Number of nights
  const [form] = Form.useForm();

  const { checkInDate: initialCheckIn, checkOutDate: initialCheckOut } =
    location.state || {};

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await axios.get(`/api/package/getPackage/${id}`);
        const packageData = response.data.package;
        console.log("Package data from backend:", packageData); // Debug log
        setPkg(packageData);

        // Use backend-provided values
        const base = packageData.basePrice;
        const discounted = packageData.discountedPrice || base; // Fallback to base if no discount
        const discount = packageData.discountApplied ? base - discounted : 0;

        setBasePrice(base);
        setDiscountAmount(discount);
        setTotalPrice(discounted); // Default to 1 night

        if (initialCheckIn && initialCheckOut) {
          const checkInMoment = moment(initialCheckIn);
          const checkOutMoment = moment(initialCheckOut);
          if (checkInMoment.isValid() && checkOutMoment.isValid()) {
            form.setFieldsValue({
              dates: [checkInMoment, checkOutMoment],
            });
            const nights = checkOutMoment.diff(checkInMoment, "days");
            setNights(nights > 0 ? nights : 1);
            setTotalPrice(discounted * (nights > 0 ? nights : 1));
          }
        }
      } catch (error) {
        console.error("Error fetching package:", error);
      }
    };
    fetchPackage();
  }, [id, form, initialCheckIn, initialCheckOut]);

  const onDateChange = (dates) => {
    if (dates && dates.length === 2) {
      const [checkInDate, checkOutDate] = dates;
      setSelectedDates([checkInDate, checkOutDate]);

      // Calculate number of nights
      const nights = checkOutDate.diff(checkInDate, "days");
      setNights(nights > 0 ? nights : 1);

      // Calculate total price
      const discountedPrice = basePrice - discountAmount; // Price per night after discount
      const newTotalPrice = discountedPrice * (nights > 0 ? nights : 1);
      setTotalPrice(newTotalPrice);
    } else {
      setSelectedDates([]);
      setNights(1);
      setTotalPrice(basePrice - discountAmount); // Reset to single night price
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    if (!currentUser) {
      message.error("You must be logged in to make a reservation.");
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const userID = currentUser._id;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const checkInDate = values.dates[0].format("YYYY-MM-DD");
      const checkOutDate = values.dates[1].format("YYYY-MM-DD");

      const bookings = await axios.get("/api/booking/getBookings");
      const relevantBookings = bookings.data.bookings.filter(
        (booking) =>
          booking.package._id === id &&
          booking.status === "confirmed" &&
          new Date(booking.checkInDate) <= new Date(checkOutDate) &&
          new Date(booking.checkOutDate) >= new Date(checkInDate)
      );
      if (relevantBookings.length >= pkg.roomType.totalRooms) {
        message.error("This package is fully booked for the selected dates.");
        return;
      }

      const reservationData = {
        packageId: id,
        userId: userID,
        checkInDate,
        checkOutDate,
        guestName: values.name,
        guestEmail: values.email,
        guestPhone: values.phone,
        totalAmount: totalPrice,
      };

      const response = await axios.post(
        "/api/booking/reservePackage",
        reservationData
      );
      setIsModalOpen(false);
      form.resetFields();
      message.success("Reservation successful!");
      navigate(`/booking-confirmation/${response.data.booking._id}`);
    } catch (error) {
      console.error("Failed to reserve:", error);
      message.error(
        "Reservation failed: " +
          (error.response?.data?.message || "Server error")
      );
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const fullRefundDate = moment().add(2, "days").format("MMM Do YYYY");
  const partialRefundDate = moment().add(3, "days").format("MMM Do YYYY");

  if (!pkg) return <p>Loading...</p>;

  return (
    <div className="package-details-page" style={{ padding: "20px" }}>
      <div className="package-image">
        <img
          src={pkg.image || packageImg}
          alt={pkg.name}
          style={{ maxWidth: "100%", borderRadius: "8px" }}
        />
      </div>
      <div className="package-info">
        <h1>
          {pkg.name} <span>{pkg.capacity} Guests</span>
        </h1>
        <ul className="package-description">
          <li>Room Type: {pkg.roomType?.name || "N/A"}</li>
          <li>
            Features:{" "}
            {pkg.features.length > 0
              ? pkg.features.join(", ")
              : "No features listed"}
          </li>
        </ul>

        <h3>Cancellation Rules</h3>
        <p className="cancellation-rules">
          Free cancellation until <strong>{fullRefundDate}</strong>.<br />
          After <strong>{partialRefundDate}</strong>: <span>50% refund.</span>
        </p>

        <div className="pricing" style={{ marginTop: "20px" }}>
          <div
            className="price-details"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div>
              <p style={{ margin: 0 }}>Base Price (per night):</p>
              <p style={{ margin: 0 }}>${basePrice.toFixed(2)}</p>
            </div>
            {discountAmount > 0 && (
              <div>
                <p style={{ margin: 0 }}>Discount Amount (per night):</p>
                <p style={{ margin: 0, color: "green" }}>
                  -${discountAmount.toFixed(2)}
                </p>
              </div>
            )}
            <div>
              <p style={{ margin: 0 }}>Total Price ({nights} nights):</p>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                ${totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            className="choose-button"
            onClick={showModal}
            style={{
              backgroundColor: "#219652",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Reserve Now
          </button>
        </div>

        <Modal
          title={`Reserve ${pkg.name}`}
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleOk}>
              Reserve
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Name"
              name="name"
              initialValue={currentUser.name || ""}
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              initialValue={currentUser.email || ""}
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Please enter your phone number" },
                {
                  pattern: /^[0-9]+$/,
                  message: "Please enter a valid phone number",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Check-in & Check-out Dates"
              name="dates"
              rules={[
                {
                  required: true,
                  message: "Please select check-in and check-out dates",
                },
              ]}
            >
              <DatePicker.RangePicker
                format="YYYY-MM-DD"
                onChange={onDateChange}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default PackageViewPage;