import React, { useState, useEffect } from "react";
import { Space, Table, Modal, Input, Form, Select, InputNumber, message } from "antd";
import { Icon } from "@iconify/react";
import axios from "axios";
import { Typography } from "antd";

const { Title, Text } = Typography;

const ManagePackages = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePackageId, setDeletePackageId] = useState(null);
  const [packages, setPackages] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [roomTypeForm] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [packagesResponse, roomTypesResponse] = await Promise.all([
          axios.get("/api/package/getPackages"),
          axios.get("/api/package/getRoomTypes"),
        ]);

        const fetchedPackages = Array.isArray(packagesResponse.data.packages)
          ? packagesResponse.data.packages
          : [];
        const fetchedRoomTypes = Array.isArray(roomTypesResponse.data.roomTypes)
          ? roomTypesResponse.data.roomTypes
          : [];

        setPackages(fetchedPackages);
        setFilteredPackages(fetchedPackages);
        setRoomTypes(fetchedRoomTypes);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load packages or room types.");
        setPackages([]);
        setFilteredPackages([]);
        setRoomTypes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const tempList = packages.filter(
      (pkg) =>
        (pkg.name && pkg.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pkg.roomType?.name &&
          pkg.roomType.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pkg.features &&
          pkg.features.some((feature) =>
            feature.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );
    setFilteredPackages(tempList);
  }, [searchTerm, packages]);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const showUpdateModal = (pkg) => {
    setEditingPackage(pkg);
    setIsUpdateModalOpen(true);
    updateForm.setFieldsValue({
      name: pkg.name,
      roomType: pkg.roomType?._id,
      basePrice: pkg.basePrice,
      capacity: pkg.capacity,
      features: pkg.features?.join(", ") || "",
      image: pkg.image,
    });
  };

  const handleUpdateCancel = () => {
    setIsUpdateModalOpen(false);
    updateForm.resetFields();
    setEditingPackage(null);
  };

  const showRoomTypeModal = () => setIsRoomTypeModalOpen(true);
  const handleRoomTypeCancel = () => {
    setIsRoomTypeModalOpen(false);
    roomTypeForm.resetFields();
  };

  const showDeleteModal = (id) => {
    setDeletePackageId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletePackageId(null);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const addPackage = async () => {
    try {
      const values = await form.validateFields();
      const packageData = { ...values, features: values.features.split(",").map((f) => f.trim()) };
      await axios.post("/api/package/addPackage", packageData);
      setIsModalOpen(false);
      message.success("Package added successfully");
      const response = await axios.get("/api/package/getPackages");
      const fetchedPackages = Array.isArray(response.data.packages) ? response.data.packages : [];
      setPackages(fetchedPackages);
      setFilteredPackages(fetchedPackages);
      form.resetFields();
    } catch (error) {
      console.error("Error adding package:", error);
      message.error(error.response?.data?.message || "Failed to add package");
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      const packageData = { ...values, features: values.features.split(",").map((f) => f.trim()) };
      await axios.put(`/api/package/updatePackage/${editingPackage._id}`, packageData);
      setIsUpdateModalOpen(false);
      message.success("Package updated successfully");
      const response = await axios.get("/api/package/getPackages");
      const fetchedPackages = Array.isArray(response.data.packages) ? response.data.packages : [];
      setPackages(fetchedPackages);
      setFilteredPackages(fetchedPackages);
      updateForm.resetFields();
    } catch (error) {
      console.error("Error updating package:", error);
      message.error(error.response?.data?.message || "Failed to update package");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/package/deletePackage/${deletePackageId}`);
      message.success("Package deleted successfully");
      const response = await axios.get("/api/package/getPackages");
      const fetchedPackages = Array.isArray(response.data.packages) ? response.data.packages : [];
      setPackages(fetchedPackages);
      setFilteredPackages(fetchedPackages);
      setIsDeleteModalOpen(false);
      setDeletePackageId(null);
    } catch (error) {
      console.error("Error deleting package:", error);
      message.error("Failed to delete package");
      setIsDeleteModalOpen(false);
      setDeletePackageId(null);
    }
  };

  const addRoomType = async () => {
    try {
      const values = await roomTypeForm.validateFields();
      console.log("Sending room type data:", values);
      const response = await axios.post("/api/package/addRoomType", values);
      console.log("Room type response:", response.data);
      setIsRoomTypeModalOpen(false);
      message.success("Room type added successfully");
      const roomTypesResponse = await axios.get("/api/package/getRoomTypes");
      const fetchedRoomTypes = Array.isArray(roomTypesResponse.data.roomTypes)
        ? roomTypesResponse.data.roomTypes
        : [];
      console.log("Fetched room types after adding:", fetchedRoomTypes);
      setRoomTypes(fetchedRoomTypes);
      roomTypeForm.resetFields();
    } catch (error) {
      console.error("Error adding room type:", error);
      message.error(error.response?.data?.message || "Failed to add room type");
    }
  };

  const columns = [
    { title: "Package Name", dataIndex: "name", key: "name", render: (text) => <a>{text}</a> },
    { title: "Room Type", dataIndex: ["roomType", "name"], key: "roomType", render: (name) => name || "N/A" },
    { title: "Base Price", dataIndex: "basePrice", key: "basePrice", render: (price) => `$${price || "N/A"}` },
    { title: "Capacity", dataIndex: "capacity", key: "capacity", render: (capacity) => `${capacity || "N/A"} guests` },
    { title: "Features", dataIndex: "features", key: "features", render: (features) => (features ? features.join(", ") : "None") },
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
            style={{ cursor: "pointer", color: "#1890ff" }} 
          />
          <Icon 
            onClick={() => showDeleteModal(record._id)} 
            icon="material-symbols:delete" 
            width="24" 
            height="24" 
            style={{ cursor: "pointer", color: "#ff4d4f" }} 
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Text>Loading packages...</Text>
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
    <div className="manage-packages" style={{ padding: "20px" }}>
      <div className="manage-packages-content">
        <div className="manage-packages-header">
          <Title level={1}>Manage Packages</Title>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <Input
              type="text"
              placeholder="Search packages"
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
                fontWeight: "bold"
              }}
            >
              Add Package
            </button>
            <button
              onClick={showRoomTypeModal}
              style={{ 
                backgroundColor: "#1e88e5", 
                color: "white", 
                border: "none", 
                padding: "10px 20px", 
                borderRadius: "4px", 
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Add Room Type
            </button>
          </div>
        </div>

        {/* Add Package Modal */}
        <Modal 
          title="Add Package" 
          open={isModalOpen} 
          onOk={addPackage} 
          onCancel={handleCancel}
          okText="Add Package"
          okButtonProps={{ style: { backgroundColor: '#219652', borderColor: '#219652' } }}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Package Name" name="name" rules={[{ required: true, message: "Please enter the package name" }]}>
              <Input placeholder="Enter package name" />
            </Form.Item>
            <Form.Item label="Room Type" name="roomType" rules={[{ required: true, message: "Please select a room type" }]}>
              <Select placeholder="Select room type">
                {roomTypes.map((type) => (
                  <Select.Option key={type._id} value={type._id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Base Price" name="basePrice" rules={[{ required: true, message: "Please enter the base price" }, { type: "number" }]}>
              <InputNumber placeholder="Enter base price" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: "Please enter the capacity" }, { type: "number" }]}>
              <InputNumber placeholder="Enter capacity" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Features" name="features" rules={[{ required: true, message: "Please enter features (comma-separated)" }]}>
              <Input placeholder="Enter features (e.g., WiFi, Breakfast)" />
            </Form.Item>
            <Form.Item label="Image URL" name="image">
              <Input placeholder="Paste image URL" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Room Type Modal */}
        <Modal 
          title="Add Room Type" 
          open={isRoomTypeModalOpen} 
          onOk={addRoomType} 
          onCancel={handleRoomTypeCancel}
          okText="Add Room Type"
          okButtonProps={{ style: { backgroundColor: '#1e88e5', borderColor: '#1e88e5' } }}
        >
          <Form form={roomTypeForm} layout="vertical">
            <Form.Item label="Room Type Name" name="name" rules={[{ required: true, message: "Please enter the room type name" }]}>
              <Input placeholder="Enter room type name" />
            </Form.Item>
            <Form.Item label="Total Rooms" name="totalRooms" rules={[{ required: true, message: "Please enter the total number of rooms" }, { type: "number" }]}>
              <InputNumber placeholder="Enter total rooms" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input placeholder="Enter description (optional)" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Confirm Delete"
          open={isDeleteModalOpen}
          onOk={confirmDelete}
          onCancel={handleDeleteCancel}
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
        >
          <p>Are you sure you want to delete this package? This action cannot be undone.</p>
        </Modal>

        <div className="manage-packages-table" style={{ marginTop: "20px" }}>
          <Table 
            columns={columns} 
            dataSource={[...filteredPackages].reverse()} 
            pagination={{ pageSize: 6 }} 
            rowKey="_id" 
            bordered
          />
        </div>

        {/* Update Package Modal */}
        <Modal 
          title="Update Package" 
          open={isUpdateModalOpen} 
          onOk={handleUpdate} 
          onCancel={handleUpdateCancel}
          okText="Update Package"
          okButtonProps={{ style: { backgroundColor: '#1890ff', borderColor: '#1890ff' } }}
        >
          <Form form={updateForm} layout="vertical">
            <Form.Item label="Package Name" name="name" rules={[{ required: true, message: "Please enter the package name" }]}>
              <Input placeholder="Enter package name" />
            </Form.Item>
            <Form.Item label="Room Type" name="roomType" rules={[{ required: true, message: "Please select a room type" }]}>
              <Select placeholder="Select room type">
                {roomTypes.map((type) => (
                  <Select.Option key={type._id} value={type._id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Base Price" name="basePrice" rules={[{ required: true, message: "Please enter the base price" }, { type: "number" }]}>
              <InputNumber placeholder="Enter base price" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: "Please enter the capacity" }, { type: "number" }]}>
              <InputNumber placeholder="Enter capacity" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Features" name="features" rules={[{ required: true, message: "Please enter features (comma-separated)" }]}>
              <Input placeholder="Enter features (e.g., WiFi, Breakfast)" />
            </Form.Item>
            <Form.Item label="Image URL" name="image">
              <Input placeholder="Paste image URL" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ManagePackages;