import React, { useState, useEffect } from "react";
import axios from "axios";
import AttendanceModal from "./AttendanceModal";
import {
  message,
  Table,
  Card,
  Avatar,
  Row,
  Col,
  Input,
  Button,
  Modal,
  Form,
  Typography,
  Tag,
  Tooltip,
  Space,
  Popconfirm,
  Select,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]); // For the dropdown
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchEmployeeNames();
  }, []);

  // Fetch all employees for the table
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      console.log("Fetching employees..."); // Debugging
      const response = await axios.get(
        "http://localhost:5000/api/employee/getEmployees"
      );
      console.log("Employees fetched:", response.data); // Debugging
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error); // Debugging
      message.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee names for the dropdown
  const fetchEmployeeNames = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/employee/getEmployeeNames"
      );
      setEmployeeNames(response.data || []);
    } catch (error) {
      message.error("Failed to fetch employee names");
    }
  };

  // Handle employee selection from the dropdown
  const handleEmployeeSelect = (value) => {
    const selectedEmployee = employeeNames.find((emp) => emp.userID === value);
    if (selectedEmployee) {
      form.setFieldsValue({
        firstName: selectedEmployee.firstName,
        lastName: selectedEmployee.lastName,
        email: selectedEmployee.email,
        username: selectedEmployee.username,
      });
    }
  };

  // Handle form submission
  const handleAddEdit = async (values) => {
    try {
      const employeeData = {
        ...values,
        imageUrl: values.imageUrl || "",
      };

      if (editingEmployee) {
        // Update the employee
        await axios.put(
          `http://localhost:5000/api/employee/${editingEmployee.employeeId}`,
          employeeData
        );
        message.success("Employee updated successfully");
      } else {
        // Add a new employee
        await axios.post(
          "http://localhost:5000/api/employee/addEmployee",
          employeeData
        );
        message.success("Employee added successfully");
      }

      // Refresh the table data
      await fetchEmployees(); // Ensure this is called

      // Reset form and close modal
      form.resetFields();
      setIsModalVisible(false);
      setEditingEmployee(null);
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to save employee");
      }
    }
  };
  // Handle delete employee
  const handleDelete = async (employeeId) => {
    try {
      await axios.post("http://localhost:5000/api/employee/deleteEmployee", {
        employeeId,
      });
      message.success("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      message.error("Failed to delete employee");
    }
  };

  // Show modal for adding/editing an employee
  const showModal = (employee = null) => {
    setEditingEmployee(employee);
    if (employee) {
      form.setFieldsValue(employee);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // Handle marking attendance
  const handleMarkAttendance = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setAttendanceModalVisible(true);
  };

  // Download CSV for all employees
  const downloadCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Username",
      "Department",
      "Tasks Completed",
      "Recent Achievement",
    ];

    const csvData = employees.map((employee) => [
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.username,
      employee.department,
      employee.tasksCompleted,
      employee.recentAchievement,
    ]);

    let csvString = `${headers.join(",")}\n`;
    csvData.forEach((row) => {
      csvString += `${row.join(",")}\n`;
    });

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "employees.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download attendance CSV for a specific employee or all employees
  const downloadAttendanceCSV = async (employeeId = null) => {
    try {
      const url = employeeId
        ? `http://localhost:5000/api/attendance/monthlyAttendance/${employeeId}`
        : "http://localhost:5000/api/attendance/allEmployeesAttendance";
      const response = await axios.get(url, {
        params: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        },
      });

      const headers = ["Employee ID", "Date", "Status"];
      const csvData = response.data.map((attendance) => [
        attendance.employeeId,
        new Date(attendance.date).toLocaleDateString(),
        attendance.status,
      ]);

      let csvString = `${headers.join(",")}\n`;
      csvData.forEach((row) => {
        csvString += `${row.join(",")}\n`;
      });

      const blob = new Blob([csvString], { type: "text/csv" });
      const urlObject = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", urlObject);
      a.setAttribute(
        "download",
        employeeId ? "employee_attendance.csv" : "all_employees_attendance.csv"
      );
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      message.error("Failed to download attendance data");
    }
  };

  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_, record) => (
        <Space>
          <Avatar src={record.imageUrl || undefined} icon={<UserOutlined />} />
          <span>
            {record.firstName} {record.lastName}
          </span>
        </Space>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (department) => <Tag color="blue">{department}</Tag>,
    },
    {
      title: "Attendance",
      key: "attendance",
      render: (_, employee) => (
        <Button onClick={() => handleMarkAttendance(employee.employeeId)}>
          Mark Attendance
        </Button>
      ),
    },
    {
      title: "Tasks Completed",
      dataIndex: "tasksCompleted",
      key: "tasksCompleted",
      render: (tasks) => <Text strong>{tasks}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, employee) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => showModal(employee)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this employee?"
              onConfirm={() => handleDelete(employee.employeeId)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Download Attendance">
            {/* <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadAttendanceCSV(employee.employeeId)}
            /> */}
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="manage-employees" style={{ padding: "24px" }}>
      <Card
        title={<Title level={4}>Existing Employees</Title>}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Add New Employee
            </Button>
            {/* <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={downloadCSV}
            >
              Download CSV
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => downloadAttendanceCSV()}
            >
              Download All Attendance
            </Button> */}
          </Space>
        }
        style={{ marginTop: "24px" }}
      >
        <Input.Search
          placeholder="Search employees"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(value) => setSearchTerm(value)}
          style={{ marginBottom: 16 }}
        />

        <Table
          loading={loading}
          dataSource={employees.filter((employee) =>
            `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.username}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )}
          columns={columns}
          rowKey="employeeId"
        />
      </Card>
      <Modal
        title={
          <Title level={4}>
            {editingEmployee ? "Edit Employee" : "Add New Employee"}
          </Title>
        }
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleAddEdit} layout="vertical">
          <Form.Item
            name="userID"
            label="Select Employee"
            rules={[{ required: true, message: "Please select an employee" }]}
          >
            <Select
              showSearch
              placeholder="Select an employee"
              optionFilterProp="children"
              onChange={handleEmployeeSelect}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {employeeNames.map((employee) => (
                <Option key={employee.userID} value={employee.userID}>
                  {employee.firstName} {employee.lastName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="imageUrl"
            label="Profile Picture URL"
            rules={[
              {
                required: true,
                type: "url",
                message: "Please enter a valid URL",
              },
            ]}
          >
            <Input placeholder="Enter image URL" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select a department">
              <Option value="Guest Service">Guest Service</Option>
              <Option value="House Keeping">House Keeping</Option>
              <Option value="Food & Beverage">Food & Beverage</Option>
              <Option value="Maintenance & Security">
                Maintenance & Security
              </Option>
              <Option value="Accounts & Finance">Accounts & Finance</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="tasksCompleted"
            label="Tasks Completed"
            rules={[{ required: true }]}
          >
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="recentAchievement" label="Recent Achievement">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingEmployee ? "Update" : "Add"} Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <AttendanceModal
        employeeId={selectedEmployeeId}
        visible={attendanceModalVisible}
        onCancel={() => setAttendanceModalVisible(false)}
      />
    </div>
  );
}

export default ManageEmployees;
