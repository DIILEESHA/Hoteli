import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Button, Typography, message, Modal, List, Image } from "antd";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import "../css/users/offers.css"; // Optional CSS file for styling

const { Title, Text } = Typography;

const Offers = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await axios.get("/api/discounts/getDiscounts");
        console.log("API Response:", response.data); // Debug log
        setDiscounts(
          Array.isArray(response.data.discounts) ? response.data.discounts : []
        );
      } catch (error) {
        console.error("Error fetching discounts:", error);
        message.error("Failed to load offers");
        setDiscounts([]); // Fallback to empty array on error
      } finally {
        setLoading(false); // Done loading
      }
    };
    fetchDiscounts();
  }, []);

  // Handle "View Packages" button click
  const handleViewPackages = (discount) => {
    setSelectedPackages(discount.applicablePackages); // Set applicable packages
    setIsModalVisible(true); // Open the modal
  };

  // Handle "View Single Package Details" button click in the modal
  const handleViewSinglePackage = (packageId) => {
    navigate(`/packages/${packageId}`); // Navigate to single package view page
    setIsModalVisible(false); // Close the modal after navigation
  };

  // Render loading state
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Text>Loading offers...</Text>
      </div>
    );
  }

  return (
    <div
      className="offers-page"
      style={{ padding: "40px", backgroundColor: "#f5f5f5" }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: "40px" }}>
        Current Offers
      </Title>
      {discounts.length === 0 ? (
        <Text>No active offers available at this time.</Text>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {discounts.map((discount) => (
            <Card
              key={discount._id}
              hoverable
              style={{
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "16px" }}>
                <Title level={4} style={{ margin: 0 }}>
                  {discount.name}
                </Title>
                <Text style={{ display: "block", margin: "8px 0" }}>
                  {discount.description}
                </Text>
                <Text strong>Applicable Packages: </Text>
                <Text>
                  {discount.applicablePackages.length === 0
                    ? "All Packages"
                    : discount.applicablePackages
                        .map((pkg) => pkg.name)
                        .join(", ")}
                </Text>
                <br />
                <Text>
                  <strong>Valid: </strong>
                  {moment(discount.startDate).format("MMM D, YYYY")} -{" "}
                  {moment(discount.endDate).format("MMM D, YYYY")}
                </Text>
                <Button
                  type="primary"
                  block
                  style={{ marginTop: "16px" }}
                  onClick={() => handleViewPackages(discount)} // Open modal on click
                >
                  View Packages
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal to display applicable packages */}
      <Modal
        title="Applicable Packages"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          dataSource={selectedPackages}
          renderItem={(pkg) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleViewSinglePackage(pkg._id)} // Navigate to single package view
                >
                  View Details
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Image
                    src={pkg.image}
                    style={{
                      width: "15vw",
                      height: "25vh",
                      objectFit: "cover",
                    }}
                  />
                }
                title={pkg.name}
                description={
                  <>
                    <Text>{pkg.description}</Text>
                    <br />
                    <Text strong>Price: ${pkg.basePrice}</Text>
                    <br />
                    {/* <Text strong>Discounted Price: ${pkg?.discountedPrice}</Text> */}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default Offers;
