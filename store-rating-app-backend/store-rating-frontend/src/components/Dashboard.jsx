import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function Dashboard() {
  const { token, role } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        let url = "";
        if (role === "admin") url = "http://localhost:5000/api/admin/dashboard";
        else if (role === "store_owner") url = "http://localhost:5000/api/store-owner/dashboard";
        else url = "http://localhost:5000/api/user/stores";

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [role, token]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (role === "admin") {
    return (
      <div>
        <h2>Admin Dashboard</h2>
        {/* Show total users, stores, ratings from data */}
        <p>Total Users: {data.totalUsers}</p>
        <p>Total Stores: {data.totalStores}</p>
        <p>Total Ratings: {data.totalRatings}</p>
      </div>
    );
  } else if (role === "store_owner") {
    return (
      <div>
        <h2>Store Owner Dashboard</h2>
        {/* Show average rating, list of users who rated their store */}
        <p>Average Rating: {data.averageRating}</p>
        <h3>Users who rated your store:</h3>
        <ul>
          {data.raters.map((user) => (
            <li key={user.id}>{user.name} - Rating: {user.rating}</li>
          ))}
        </ul>
      </div>
    );
  } else {
    // normal user view
    return (
      <div>
        <h2>User Dashboard - Stores</h2>
        <ul>
          {data.stores.map((store) => (
            <li key={store.id}>
              {store.name} - Rating: {store.overallRating} <br />
              Your Rating: {store.userRating || "Not rated"}
              {/* Add buttons/forms here to submit/modify rating */}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
