import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Input,
  Space,
  Select,
  Typography
} from "antd";
import axios from "axios";
import { CSVLink } from "react-csv";
import { SearchOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import moment from "moment";

const { Option } = Select;
const { Title } = Typography;

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const statusColors = {
    pending: "orange",
    confirmed: "green",
    cancelled: "red",
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.current, searchText, selectedStatus]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/booking/allBookings", {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          status: selectedStatus === "all" ? undefined : selectedStatus,
        },
      });
      setBookings(data.bookings);
      setPagination({
        ...pagination,
        total: data.totalBookings,
        totalPages: data.totalPages,
      });
    } catch (error) {
      message.error("Failed to fetch bookings");
      console.error("Fetch bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.post(`/api/booking/updateStatus/${bookingId}`, { status: newStatus });
      message.success("Booking status updated");
      fetchBookings();
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const handleDelete = async (bookingId) => {
    try {
      await axios.delete(`/api/booking/${bookingId}`);
      message.success("Booking deleted");
      fetchBookings();
    } catch (error) {
      message.error("Failed to delete booking");
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleDownloadBooking = async (bookingId) => {
    try {
      console.log("Downloading booking details for ID:", bookingId); // Debugging
      const response = await axios.get(`/api/booking/getBookingDetails/${bookingId}`);
  
      console.log("API Response:", response.data); // Debugging
      const bookingData = response.data;
  
      if (!bookingData) {
        message.error("Booking details not found.");
        return;
      }
  
      const csvData = [
        [
          "Guest Name",
          "Email",
          "Phone",
          "Package",
          "Check-in",
          "Check-out",
          "Amount",
          "Status",
        ],
        [
          bookingData.guestName,
          bookingData.guestEmail,
          bookingData.guestPhone,
          bookingData.package?.name || "N/A",
          moment(bookingData.checkInDate).format("MMM Do YYYY"),
          moment(bookingData.checkOutDate).format("MMM Do YYYY"),
          `$${bookingData.totalAmount.toFixed(2)}`,
          bookingData.status,
        ],
      ];
  
      const csvBlob = new Blob([csvData.map(row => row.join(",")).join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
  
      const link = document.createElement("a");
      link.href = URL.createObjectURL(csvBlob);
      link.download = `booking_${bookingId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      message.error("Failed to download booking details.");
    }
  };
  
  

  const columns = [
    {
      title: "Guest",
      dataIndex: "guestName",
      key: "guest",
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div>{record.guestEmail}</div>
          <div>{record.guestPhone}</div>
        </div>
      ),
    },
    {
      title: "Package",
      dataIndex: ["packageId", "name"],
      key: "package",
      render: (text) => text || "N/A",
    },
    {
      title: "Dates",
      key: "dates",
      render: (_, record) => (
        <div>
          <div>Check-in: {moment(record.checkInDate).format("MMM Do YYYY")}</div>
          <div>Check-out: {moment(record.checkOutDate).format("MMM Do YYYY")}</div>
          <div>
            Nights: {moment(record.checkOutDate).diff(moment(record.checkInDate), "days")}
          </div>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "amount",
      render: (amount) => `$${amount.toFixed(2)}`,
      align: "right",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "blue"}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Select
            defaultValue={record.status}
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(record._id, value)}
          >
            <Option value="pending">Pending</Option>
            <Option value="confirmed">Confirmed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>

          <Popconfirm
            title="Are you sure to delete this booking?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>

          {/* <Button icon={<DownloadOutlined />} onClick={() => handleDownloadBooking(record._id)} /> */}
        </Space>
      ),
    },
  ];

  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const totalConfirmedAmount = confirmedBookings.reduce((acc, booking) => acc + booking.totalAmount, 0);

  return (
    <div style={{ padding: "20px" }}>
      <Card title="Manage Bookings">
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Input
              placeholder="Search by guest name, email or status"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <CSVLink data={confirmedBookings} filename={"confirmed_bookings.csv"}>
              {/* <Button type="primary" icon={<DownloadOutlined />}>Export Confirmed</Button> */}
            </CSVLink>
            <CSVLink data={pendingBookings} filename={"pending_bookings.csv"} style={{ marginLeft: 10 }}>
              {/* <Button type="primary" icon={<DownloadOutlined />}>Export Pending</Button> */}
            </CSVLink>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />

        <Title level={4} style={{ marginTop: 20 }}>
          {/* Total Confirmed Bookings Revenue: ${totalConfirmedAmount.toFixed(2)} */}
        </Title>
      </Card>
    </div>
  );
};

export default ManageBookings;
