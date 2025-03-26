import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Form,
  Input,
  DatePicker,
  message,
  Table,
  Tag,
  Space,
  Popconfirm,
  Select,
  Alert,
} from "antd";
import moment from "moment";
import { EditOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import { saveAs } from "file-saver"; // Import the file-saver package for CSV download

const { Option } = Select;

const EventBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const itemsPerPage = 5;

  const statusColors = {
    pending: "orange",
    confirmed: "green",
    cancelled: "red",
  };

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      setUserRole(currentUser.role);
      setUserId(currentUser._id);
    }
    fetchBookings();
  }, [userRole]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      let response;
      if (userRole === "admin") {
        response = await axios.get("/api/booking/allBookings");
      } else {
        response = await axios.get("/api/booking/userBookings", {
          params: { userId: currentUser._id },
        });
      }

      let filtered = response.data.bookings || [];
      if (userRole === "guest") {
        filtered = filtered.filter((booking) => booking.status === "confirmed");
      }

      setBookings(response.data.bookings || []);
      setFilteredBookings(filtered);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error(error.response?.data?.message || "Failed to fetch bookings");
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking) => {
    if (booking.status !== "pending" && userRole !== "admin") {
      message.warning("Only pending bookings can be edited");
      return;
    }

    setSelectedBooking(booking);
    form.setFieldsValue({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (bookingId, status) => {
    if (status !== "pending" && userRole !== "admin") {
      message.warning("Only pending bookings can be deleted");
      return;
    }

    try {
      await axios.delete(`/api/booking/${bookingId}`);
      message.success("Booking deleted successfully");
      fetchBookings();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete booking");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const updatedFields = {
        guestName: values.guestName,
        guestEmail: values.guestEmail,
        guestPhone: values.guestPhone,
      };

      const response = await axios.put(`/api/booking/updateStatus/${selectedBooking._id}`, updatedFields);

      message.success("Booking updated successfully");
      setIsModalOpen(false);
      fetchBookings();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to update booking");
    }
  };

  const handleDownloadCSV = (booking) => {
    const csvData = [
      ["Package", "Check-In", "Check-Out", "Amount", "Status", "Guest Name", "Guest Email", "Guest Phone"],
      [
        booking.packageId?.name,
        moment(booking.checkInDate).format("YYYY-MM-DD"),
        moment(booking.checkOutDate).format("YYYY-MM-DD"),
        `$${booking.totalAmount}`,
        booking.status.toUpperCase(),
        booking.guestName,
        booking.guestEmail,
        booking.guestPhone,
      ],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `booking_${booking._id}.csv`);
  };

  const columns = [
    {
      title: "Package",
      dataIndex: ["packageId", "name"],
      key: "package",
    },
    {
      title: "Check-In",
      dataIndex: "checkInDate",
      key: "checkIn",
      render: (date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Check-Out",
      dataIndex: "checkOutDate",
      key: "checkOut",
      render: (date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "amount",
      render: (amount) => `$${amount}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status.toLowerCase()]}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.status !== "pending" && userRole !== "admin"}
          >
          </Button>
          <Popconfirm
            title="Are you sure to delete this booking?"
            onConfirm={() => handleDelete(record._id, record.status)}
            okText="Yes"
            cancelText="No"
            disabled={record.status !== "pending" && userRole !== "admin"}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={record.status !== "pending" && userRole !== "admin"}
            >
            </Button>
          </Popconfirm>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadCSV(record)}
            disabled={loading}
          >
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="event-bookings-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>{userRole === "admin" ? "All Bookings" : "My Bookings"}</h2>
        {userRole === "admin" && (
          <Button
            type="primary"
            onClick={() => {
              setSelectedBooking(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Add New Booking
          </Button>
        )}
      </div>

      {userRole === "guest" && filteredBookings.length === 0 && !loading && (
        <Alert
          message="No confirmed bookings found"
          description="Your bookings will appear here once they are confirmed by the admin."
          type="info"
          showIcon
        />
      )}

      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: itemsPerPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      <Modal
        title="Update Booking Details"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="Update"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="guestName"
            label="Guest Name"
            rules={[{ required: true, message: "Please enter guest name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="guestEmail"
            label="Guest Email"
            rules={[
              { required: true, message: "Please enter guest email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="guestPhone"
            label="Guest Phone"
            rules={[
              { required: true, message: "Please enter guest phone" },
              {
                pattern: /^[0-9]+$/,
                message:
                  "Please enter numbers only (no letters or special characters)",
              },
              {
                min: 10,
                message: "Phone number must be at least 10 digits",
              },
              {
                max: 15,
                message: "Phone number cannot exceed 15 digits",
              },
            ]}
          >
            <Input
              type="tel"
              maxLength={15}
              onKeyPress={(event) => {
                if (!/[0-9]/.test(event.key)) {
                  event.preventDefault();
                }
              }}
            />
          </Form.Item>
          {userRole === "admin" && (
            <Form.Item label="Status">
              <Input value={selectedBooking?.status?.toUpperCase()} readOnly />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default EventBookings;
