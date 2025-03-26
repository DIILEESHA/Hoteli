import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Input, Modal, Table, message, Space, Select, DatePicker, InputNumber } from "antd";
import { Icon } from "@iconify/react";
import moment from "moment";
import { Typography } from "antd";

const { Option } = Select;
const { Title, Text } = Typography;

const ManageDiscounts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();

  // Fetch discounts and packages on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [discountsResponse, packagesResponse] = await Promise.all([
          axios.get("/api/discount/getDiscounts"), // Fixed endpoint
          axios.get("/api/package/getPackages"),
        ]);

        const fetchedDiscounts = Array.isArray(discountsResponse.data.discounts)
          ? discountsResponse.data.discounts
          : [];
        const fetchedPackages = Array.isArray(packagesResponse.data.packages)
          ? packagesResponse.data.packages
          : [];

        setDiscounts(fetchedDiscounts);
        setFilteredDiscounts(fetchedDiscounts);
        setPackages(fetchedPackages);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load discounts or packages.");
        setDiscounts([]);
        setFilteredDiscounts([]);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter discounts based on search term
  useEffect(() => {
    const tempList = discounts.filter(
      (discount) =>
        (discount.name && discount.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (discount.description &&
          discount.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredDiscounts(tempList);
  }, [searchTerm, discounts]);

  // Modal controls
  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const showUpdateModal = (discount) => {
    setEditingDiscount(discount);
    setIsUpdateModalOpen(true);
    updateForm.setFieldsValue({
      name: discount.name,
      description: discount.description,
      type: discount.type,
      value: discount.value,
      applicablePackages: discount.applicablePackages?.map((pkg) => pkg._id) || [],
      startDate: moment(discount.startDate),
      endDate: moment(discount.endDate),
    });
  };

  const handleUpdateCancel = () => {
    setIsUpdateModalOpen(false);
    updateForm.resetFields();
    setEditingDiscount(null);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Add new discount
  const addDiscount = async () => {
    try {
      const values = await form.validateFields();
      const discountData = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        applicablePackages: values.applicablePackages || [],
      };
      await axios.post("/api/discount/addDiscount", discountData); // Fixed endpoint
      setIsModalOpen(false);
      message.success("Discount added successfully");
      const response = await axios.get("/api/discount/getDiscounts"); // Fixed endpoint
      const fetchedDiscounts = Array.isArray(response.data.discounts)
        ? response.data.discounts
        : [];
      setDiscounts(fetchedDiscounts);
      setFilteredDiscounts(fetchedDiscounts);
      form.resetFields();
    } catch (error) {
      console.error("Error adding discount:", error);
      message.error(error.response?.data?.message || "Failed to add discount");
    }
  };

  // Update discount
  const handleUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      const discountData = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        applicablePackages: values.applicablePackages || [],
      };
      await axios.put(`/api/discount/updateDiscount/${editingDiscount._id}`, discountData); // Fixed endpoint
      setIsUpdateModalOpen(false);
      message.success("Discount updated successfully");
      const response = await axios.get("/api/discount/getDiscounts"); // Fixed endpoint
      const fetchedDiscounts = Array.isArray(response.data.discounts)
        ? response.data.discounts
        : [];
      setDiscounts(fetchedDiscounts);
      setFilteredDiscounts(fetchedDiscounts);
      updateForm.resetFields();
    } catch (error) {
      console.error("Error updating discount:", error);
      message.error(error.response?.data?.message || "Failed to update discount");
    }
  };

  // Delete discount
  const deleteDiscount = async (id) => {
    try {
      await axios.delete(`/api/discount/deleteDiscount/${id}`); // Fixed endpoint
      message.success("Discount deleted successfully");
      const response = await axios.get("/api/discount/getDiscounts"); // Fixed endpoint
      const fetchedDiscounts = Array.isArray(response.data.discounts)
        ? response.data.discounts
        : [];
      setDiscounts(fetchedDiscounts);
      setFilteredDiscounts(fetchedDiscounts);
    } catch (error) {
      console.error("Error deleting discount:", error);
      message.error("Failed to delete discount");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Discount Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <a>{text || "N/A"}</a>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "N/A",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text) => text || "N/A",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (value, record) =>
        value && record.type === "percentage" ? `${value}%` : value ? `$${value}` : "N/A",
    },
    {
      title: "Applicable Packages",
      dataIndex: "applicablePackages",
      key: "applicablePackages",
      render: (packages) =>
        packages && packages.length > 0
          ? packages.map((pkg) => pkg.name).join(", ")
          : "All",
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => (date ? moment(date).format("YYYY-MM-DD") : "N/A"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date) => (date ? moment(date).format("YYYY-MM-DD") : "N/A"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Icon
            onClick={() => showUpdateModal(record)}
            icon="akar-icons:edit"
            width="24"
            height="24"
            style={{ cursor: "pointer" }}
          />
          <Icon
            onClick={() => deleteDiscount(record._id)}
            icon="material-symbols:delete"
            width="24"
            height="24"
            style={{ cursor: "pointer" }}
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Text>Loading discounts...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Text type="danger">{error}</Text>
      </div>
    );
  }

  return (
    <div className="manage-discounts" style={{ padding: "20px" }}>
      <div className="manage-discounts-content">
        <div className="manage-discounts-header">
          <Title level={1}>Manage Discounts</Title>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <Input
              type="text"
              placeholder="Search discounts"
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ width: 300, height: 40 }}
            />
            <button
              onClick={showModal}
              style={{
                backgroundColor: "#219652",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Add Discount
            </button>
          </div>
        </div>

        {/* Add Discount Modal */}
        <Modal
          title="Add Discount"
          open={isModalOpen}
          onOk={addDiscount}
          onCancel={handleCancel}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Discount Name"
              name="name"
              rules={[{ required: true, message: "Please enter the discount name" }]}
            >
              <Input placeholder="Enter discount name" />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input placeholder="Enter description" />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: "Please select a discount type" }]}
            >
              <Select placeholder="Select discount type">
                <Option value="percentage">Percentage</Option>
                <Option value="fixed">Fixed Amount</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Value"
              name="value"
              rules={[
                { required: true, message: "Please enter the discount value" },
                { type: "number", message: "Value must be a number" },
              ]}
            >
              <InputNumber placeholder="Enter value (e.g., 20 for 20%)" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Applicable Packages" name="applicablePackages">
              <Select
                mode="multiple"
                placeholder="Select applicable packages (leave empty for all)"
                allowClear
              >
                {packages.map((pkg) => (
                  <Option key={pkg._id} value={pkg._id}>
                    {pkg.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: "Please select a start date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="End Date"
              name="endDate"
              rules={[{ required: true, message: "Please select an end date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Discounts Table */}
        <div className="manage-discounts-table" style={{ marginTop: "20px" }}>
          <Table
            columns={columns}
            dataSource={[...filteredDiscounts].reverse()}
            pagination={{ pageSize: 6 }}
            rowKey="_id"
          />
        </div>

        {/* Update Discount Modal */}
        <Modal
          title="Update Discount"
          open={isUpdateModalOpen}
          onOk={handleUpdate}
          onCancel={handleUpdateCancel}
        >
          <Form form={updateForm} layout="vertical">
            <Form.Item
              label="Discount Name"
              name="name"
              rules={[{ required: true, message: "Please enter the discount name" }]}
            >
              <Input placeholder="Enter discount name" />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input placeholder="Enter description" />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: "Please select a discount type" }]}
            >
              <Select placeholder="Select discount type">
                <Option value="percentage">Percentage</Option>
                <Option value="fixed">Fixed Amount</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Value"
              name="value"
              rules={[
                { required: true, message: "Please enter the discount value" },
                { type: "number", message: "Value must be a number" },
              ]}
            >
              <InputNumber placeholder="Enter value (e.g., 20 for 20%)" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Applicable Packages" name="applicablePackages">
              <Select
                mode="multiple"
                placeholder="Select applicable packages (leave empty for all)"
                allowClear
              >
                {packages.map((pkg) => (
                  <Option key={pkg._id} value={pkg._id}>
                    {pkg.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: "Please select a start date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="End Date"
              name="endDate"
              rules={[{ required: true, message: "Please select an end date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ManageDiscounts;