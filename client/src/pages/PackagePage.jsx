import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Typography } from "antd";

const { Title, Text } = Typography;

function PackagePage() {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const navigate = useNavigate();

  // Fetch packages only
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/package/getPackages", {
          params: { checkInDate, checkOutDate },
        });

        const fetchedPackages = Array.isArray(response.data.packages)
          ? response.data.packages
          : [];

        setPackages(fetchedPackages);
        setFilteredPackages(fetchedPackages);
      } catch (error) {
        console.error("Error fetching packages:", error);
        setPackages([]);
        setFilteredPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [checkInDate, checkOutDate]);

  // Filter packages based on search term
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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle date input change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === "checkInDate") setCheckInDate(value);
    if (name === "checkOutDate") setCheckOutDate(value);
  };

  // Redirect to package details page
  const handleBookNow = (packageId) => {
    navigate(`/packages/${packageId}`, { state: { checkInDate, checkOutDate } });
  };

  // Package card component
  const PackageCard = ({ pkg }) => {
    const navigate = useNavigate();

    const handleCardClick = (packageId) => {
      navigate(`/packages/${packageId}`);
    };

    return (
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "10px",
          margin: "10px",
          width: "200px",
          textAlign: "center",
          cursor: "pointer",
        }}
        onClick={() => handleCardClick(pkg._id)}
      >
        <img
          src={pkg.image || "https://via.placeholder.com/150"}
          alt={pkg.name}
          style={{
            width: "100%",
            height: "120px",
            objectFit: "cover",
            borderRadius: "4px",
          }}
        />
        <h3 style={{ margin: "10px 0" }}>{pkg.name}</h3>
        <p>
          {pkg.discountApplied ? (
            <>
              <span style={{ textDecoration: "line-through", color: "gray" }}>
                ${pkg.basePrice}
              </span>
              <span style={{ color: "green", marginLeft: "5px" }}>
                ${pkg.discountedPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span>${pkg.basePrice}</span>
          )}
        </p>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Text>Loading packages...</Text>
      </div>
    );
  }

  return (
    <div className="package-list" style={{ padding: "20px" }}>
      <Title level={1}>Our Packages</Title>
      <hr />

      <div style={{ marginBottom: "20px" }}>
        {/* <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
          <input
            type="date"
            name="checkInDate"
            value={checkInDate}
            onChange={handleDateChange}
            style={{ padding: "5px" }}
          />
          <input
            type="date"
            name="checkOutDate"
            value={checkOutDate}
            onChange={handleDateChange}
            style={{ padding: "5px" }}
          />
        </div> */}
        <input
          type="text"
          placeholder="Search packages"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ width: "300px", padding: "5px" }}
        />
      </div>

      <div style={{ margin: "20px 0" }}>
        <Title level={2} style={{ marginBottom: "15px" }}>
          Available Packages
        </Title>
        {filteredPackages.length === 0 && checkInDate && checkOutDate ? (
          <Text>No packages available for the selected dates.</Text>
        ) : filteredPackages.length === 0 ? (
          <Text>No packages available.</Text>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {filteredPackages.map((pkg) => (
              <div
                className="package"
                key={pkg._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid #ddd",
                  padding: "10px",
                  width: "100%",
                }}
              >
                <img
                  src={pkg.image || "https://via.placeholder.com/150"}
                  alt={pkg.name}
                  style={{
                    width: "150px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <div className="package-details" style={{ flex: 1, marginLeft: "20px" }}>
                  <Title level={2}>{pkg.name}</Title>
                  <Text>Room Type: {pkg.roomType?.name || "N/A"}</Text>
                  <br />
                  <Text>Capacity: {pkg.capacity} guests</Text>
                  <br />
                  <Text>Features: {pkg.features?.join(", ") || "None"}</Text>
                </div>
                <div className="package-price" style={{ textAlign: "right" }}>
                  <Text>From</Text>
                  <br />
                  {pkg.discountApplied ? (
                    <>
                      <Text style={{ textDecoration: "line-through", color: "gray" }}>
                        ${pkg.basePrice}
                      </Text>
                      <br />
                      <Text style={{ color: "green" }}>
                        ${pkg.discountedPrice.toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text>${pkg.basePrice}</Text>
                  )}
                  <br />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookNow(pkg._id);
                    }}
                    style={{
                      backgroundColor: "#219652",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginTop: "10px",
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* {packages.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <Title level={2}>Suggested Packages</Title>
          <div style={{ display: "flex", overflowX: "auto", gap: "10px" }}>
            {packages.slice(0, 3).map((pkg) => (
              <PackageCard key={pkg._id} pkg={pkg} />
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}

export default PackagePage;