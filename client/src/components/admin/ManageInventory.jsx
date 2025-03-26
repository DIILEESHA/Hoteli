import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  message,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Space,
  Tag,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import fileDownload from "js-file-download";

const { Option } = Select;
const { confirm } = Modal;
const { Search } = Input;

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lowStockModalVisible, setLowStockModalVisible] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiredItemsModalVisible, setExpiredItemsModalVisible] = useState(false);
  const [expiredItems, setExpiredItems] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  // Fetch inventory data
  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/inventory/getItems");
      if (!response.data) {
        throw new Error("No data received from server");
      }
      setInventory(response.data);
      setFilteredInventory(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError(error.message || "Failed to fetch inventory items");
      message.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(item => 
        Object.values(item).some(
          val => val && val.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
      setFilteredInventory(filtered);
    }
  }, [searchText, inventory]);

  // Modal handlers
  const showModal = (item = null) => {
    setEditingItem(item);
    setModalVisible(true);
    if (item) {
      form.setFieldsValue({
        ...item,
        purchaseDate: moment(item.purchaseDate),
        expirationDate: moment(item.expirationDate),
      });
    } else {
      form.resetFields();
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  // Form submission handler
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.purchaseDate = values.purchaseDate.format("YYYY-MM-DD");
      values.expirationDate = values.expirationDate.format("YYYY-MM-DD");

      if (editingItem) {
        await axios.put(
          `http://localhost:5000/api/inventory/updateItem/${editingItem._id}`,
          values
        );
        message.success("Inventory item updated successfully");
      } else {
        await axios.post(
          "http://localhost:5000/api/inventory/addItem",
          values
        );
        message.success("Inventory item added successfully");
      }
      setModalVisible(false);
      await fetchInventory();
    } catch (error) {
      console.error("Operation failed:", error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message;
      message.error(`Operation failed: ${errorMessage}`);
    }
  };

  // Delete confirmation and handler
  const handleDelete = async (itemID) => {
    confirm({
      title: "Are you sure you want to delete this item?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone and will permanently remove the item from inventory.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(
            `http://localhost:5000/api/inventory/deleteItem/${itemID}`
          );
          message.success("Item deleted successfully");
          await fetchInventory();
        } catch (error) {
          console.error("Delete failed:", error);
          message.error("Failed to delete item: " + 
            (error.response?.data?.error || error.message));
        }
      },
    });
  };

  // Stock check functions
  const checkLowStock = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/inventory/checkLowStock"
      );
      if (response.data.length > 0) {
        setLowStockItems(response.data);
        setLowStockModalVisible(true);
      } else {
        message.success("All items are sufficiently stocked.");
      }
    } catch (error) {
      console.error("Low stock check failed:", error);
      message.error("Failed to check low stock: " + error.message);
    }
  };

  const checkExpiredItems = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/inventory/checkExpiredItems"
      );
      if (response.data.length > 0) {
        setExpiredItems(response.data);
        setExpiredItemsModalVisible(true);
      } else {
        message.success("No expired items found.");
      }
    } catch (error) {
      console.error("Expired items check failed:", error);
      message.error("Failed to check expired items: " + error.message);
    }
  };

  // CSV export functions
  const convertToCSV = (data, columns) => {
    const headers = columns.map(col => `"${col.title}"`).join(",");
    const rows = data.map(item => 
      columns.map(col => {
        const value = col.render ? 
          col.render(item[col.dataIndex], item) : 
          item[col.dataIndex];
        return `"${value}"`;
      }).join(",")
    );
    return [headers, ...rows].join("\n");
  };

  const downloadCSV = (data, columns, filename) => {
    try {
      const csvData = convertToCSV(data, columns);
      fileDownload(csvData, filename);
      message.success(`${filename} downloaded successfully`);
    } catch (error) {
      console.error("CSV download failed:", error);
      message.error("Failed to generate CSV file");
    }
  };

  const downloadAllProductsCSV = () => {
    const columns = [
      { title: "Item ID", dataIndex: "itemID" },
      { title: "Name", dataIndex: "name" },
      { title: "Category", dataIndex: "category" },
      { title: "Type", dataIndex: "type" },
      { title: "Stock Quantity", dataIndex: "stockQuantity" },
      { title: "Unit", dataIndex: "unit" },
      { 
        title: "Price", 
        dataIndex: "price",
        render: price => `$${price?.toFixed(2) || '0.00'}`
      },
      { 
        title: "Status", 
        dataIndex: "status",
        render: status => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
      },
      { 
        title: "Purchase Date", 
        dataIndex: "purchaseDate",
        render: date => moment(date).format("YYYY-MM-DD")
      },
      { 
        title: "Expiration Date", 
        dataIndex: "expirationDate",
        render: date => moment(date).format("YYYY-MM-DD")
      },
      { title: "Supplier", dataIndex: "supplier" },
      { title: "Reorder Level", dataIndex: "reorderLevel" },
      { title: "Min Stock Level", dataIndex: "minStockLevel" },
    ];
    
    downloadCSV(inventory, columns, "inventory_export.csv");
  };

  const downloadLowStockCSV = () => {
    const columns = [
      { title: "Item ID", dataIndex: "itemID" },
      { title: "Name", dataIndex: "name" },
      { title: "Current Stock", dataIndex: "stockQuantity" },
      { title: "Minimum Required", dataIndex: "minStockLevel" },
      { 
        title: "Status", 
        dataIndex: "status",
        render: () => <Tag color="red">Low Stock</Tag>
      }
    ];
    
    downloadCSV(lowStockItems, columns, "low_stock_items.csv");
  };

  const downloadExpiredItemsCSV = () => {
    const columns = [
      { title: "Item ID", dataIndex: "itemID" },
      { title: "Name", dataIndex: "name" },
      { 
        title: "Expiration Date", 
        dataIndex: "expirationDate",
        render: date => moment(date).format("YYYY-MM-DD")
      },
      { 
        title: "Status", 
        dataIndex: "status",
        render: () => <Tag color="orange">Expired</Tag>
      }
    ];
    
    downloadCSV(expiredItems, columns, "expired_items.csv");
  };

  // Table columns
  const columns = [
    { 
      title: "Item ID", 
      dataIndex: "itemID", 
      key: "itemID",
      sorter: (a, b) => a.itemID.localeCompare(b.itemID)
    },
    { 
      title: "Name", 
      dataIndex: "name", 
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    { 
      title: "Category", 
      dataIndex: "category", 
      key: "category",
      filters: [
        { text: 'Fruits', value: 'fruits' },
        { text: 'Vegetables', value: 'vegetables' },
      ],
      onFilter: (value, record) => record.category === value,
    },
    { 
      title: "Type", 
      dataIndex: "type", 
      key: "type",
      filters: [
        { text: 'Perishable', value: 'Perishable' },
        { text: 'Non-Perishable', value: 'Non-Perishable' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    { 
      title: "Quantity", 
      dataIndex: "stockQuantity", 
      key: "stockQuantity",
      sorter: (a, b) => a.stockQuantity - b.stockQuantity,
      render: (quantity, record) => (
        <span style={{ 
          color: quantity < record.minStockLevel ? 'red' : 'inherit',
          fontWeight: quantity < record.minStockLevel ? 'bold' : 'normal'
        }}>
          {quantity} {record.unit}
          {quantity < record.minStockLevel && (
            <WarningOutlined style={{ color: 'red', marginLeft: 5 }} />
          )}
        </span>
      )
    },
    { 
      title: "Price", 
      dataIndex: "price", 
      key: "price",
      render: price => `$${price?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => a.price - b.price
    },
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status",
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value, record) => record.status === value,
      render: status => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: "Expiration",
      key: "expiration",
      render: (_, record) => (
        moment(record.expirationDate).isBefore(moment()) ? (
          <Tag color="orange">Expired</Tag>
        ) : (
          <Tag color="blue">Valid</Tag>
        )
      ),
      filters: [
        { text: 'Valid', value: 'valid' },
        { text: 'Expired', value: 'expired' },
      ],
      onFilter: (value, record) => 
        value === 'expired' ? 
        moment(record.expirationDate).isBefore(moment()) :
        !moment(record.expirationDate).isBefore(moment()),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
            title="Edit"
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            danger
            title="Delete"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h1>Manage Inventory</h1>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add New Item
          </Button>
          {/* <Button 
            type="primary" 
            onClick={checkLowStock}
            icon={<WarningOutlined />}
          >
            Check Low Stock
          </Button> */}
          {/* <Button 
            type="primary" 
            onClick={checkExpiredItems}
            icon={<ExclamationCircleOutlined />}
          >
            Check Expired Items
          </Button> */}
        </Space>

        <Space>
          <Search
            placeholder="Search inventory..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadAllProductsCSV}
          >
            Export CSV
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredInventory}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        bordered
      />

      {/* Add/Edit Item Modal */}
      <Modal
        title={editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={handleModalCancel}
        okText={editingItem ? "Update" : "Add"}
        cancelText="Cancel"
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="itemID" 
            label="Item ID" 
            rules={[
              { required: true, message: "Please input the item ID!" },
              { max: 20, message: "Item ID must be less than 20 characters" }
            ]}
          >
            <Input placeholder="INV-001" />
          </Form.Item>
          
          <Form.Item 
            name="name" 
            label="Name" 
            rules={[
              { required: true, message: "Please input the item name!" },
              { max: 50, message: "Name must be less than 50 characters" }
            ]}
          >
            <Input placeholder="Item Name" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select a category!" }]}
          >
            <Select placeholder="Select category">
              <Option value="fruits">Fruits</Option>
              <Option value="vegetables">Vegetables</Option>
              <Option value="dairy">Dairy</Option>
              <Option value="meat">Meat</Option>
              <Option value="beverages">Beverages</Option>
              <Option value="dry-goods">Dry Goods</Option>
              <Option value="frozen">Frozen</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Please select a type!" }]}
          >
            <Select placeholder="Select type">
              <Option value="Perishable">Perishable</Option>
              <Option value="Non-Perishable">Non-Perishable</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="stockQuantity"
            label="Stock Quantity"
            rules={[
              { required: true, message: "Please input the stock quantity!" },
              { type: "number", min: 0, message: "Quantity must be a positive number" }
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="unit"
            label="Unit"
            rules={[
              { required: true, message: "Please input the unit!" },
              { max: 10, message: "Unit must be less than 10 characters" }
            ]}
          >
            <Input placeholder="kg, g, L, etc." />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Price"
            rules={[
              { required: true, message: "Please input the price!" },
              { type: "number", min: 0.01, message: "Price must be at least 0.01" }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status!" }]}
          >
            <Select placeholder="Select status">
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="purchaseDate"
            label="Purchase Date"
            rules={[{ required: true, message: "Please select purchase date!" }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="expirationDate"
            label="Expiration Date"
            rules={[{ required: true, message: "Please select expiration date!" }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="supplier"
            label="Supplier"
            rules={[
              { required: true, message: "Please input the supplier!" },
              { max: 100, message: "Supplier must be less than 100 characters" }
            ]}
          >
            <Input placeholder="Supplier Name" />
          </Form.Item>
          
          <Form.Item
            name="reorderLevel"
            label="Reorder Level"
            rules={[
              { required: true, message: "Please input the reorder level!" },
              { type: "number", min: 1, message: "Reorder level must be at least 1" }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          
          <Form.Item
            name="minStockLevel"
            label="Minimum Stock Level"
            rules={[
              { required: true, message: "Please input the minimum stock level!" },
              { type: "number", min: 0, message: "Minimum stock must be 0 or more" }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Low Stock Items Modal */}
      <Modal
        title="Low Stock Items"
        visible={lowStockModalVisible}
        onCancel={() => setLowStockModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setLowStockModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={downloadLowStockCSV}
          >
            Export CSV
          </Button>,
        ]}
        width={800}
      >
        <Table
          columns={[
            { title: "Item ID", dataIndex: "itemID" },
            { title: "Name", dataIndex: "name" },
            { 
              title: "Current Stock", 
              dataIndex: "stockQuantity",
              render: (quantity, record) => (
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                  {quantity} {record.unit}
                </span>
              )
            },
            { title: "Minimum Required", dataIndex: "minStockLevel" },
            { 
              title: "Difference", 
              render: (_, record) => (
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                  {record.stockQuantity - record.minStockLevel}
                </span>
              )
            },
          ]}
          dataSource={lowStockItems}
          rowKey="_id"
          pagination={false}
          bordered
        />
      </Modal>

      {/* Expired Items Modal */}
      <Modal
        title="Expired Items"
        visible={expiredItemsModalVisible}
        onCancel={() => setExpiredItemsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setExpiredItemsModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={downloadExpiredItemsCSV}
          >
            Export CSV
          </Button>,
        ]}
        width={800}
      >
        <Table
          columns={[
            { title: "Item ID", dataIndex: "itemID" },
            { title: "Name", dataIndex: "name" },
            { 
              title: "Expiration Date", 
              dataIndex: "expirationDate",
              render: date => (
                <span style={{ color: 'orange', fontWeight: 'bold' }}>
                  {moment(date).format("YYYY-MM-DD")}
                </span>
              )
            },
            { 
              title: "Days Expired", 
              render: (_, record) => (
                <span style={{ color: 'orange', fontWeight: 'bold' }}>
                  {moment().diff(moment(record.expirationDate), 'days')} days
                </span>
              )
            },
          ]}
          dataSource={expiredItems}
          rowKey="_id"
          pagination={false}
          bordered
        />
      </Modal>
    </div>
  );
};

export default ManageInventory;