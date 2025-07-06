import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Stores() {
  const { token } = useContext(AuthContext);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    try {
      const res = await axios.get("http://localhost:5000/api/stores", {
        headers: { Authorization: `Bearer ${token}` },
        params: { search }, // send search param if backend supports
      });
      setStores(res.data.stores);
    } catch (err) {
      setError("Failed to fetch stores");
    }
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    fetchStores();
  }

  return (
    <div>
      <h2>Stores List</h2>
      <form onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search by name or address"
          value={search}
          onChange={handleSearchChange}
        />
        <button type="submit">Search</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {stores.map((store) => (
          <li key={store.id}>
            <strong>{store.name}</strong> - {store.address} <br />
            Overall Rating: {store.overallRating || "No ratings yet"} <br />
            Your Rating: {store.userRating || "Not rated"} <br />
            {/* TODO: Add submit/modify rating buttons here */}
          </li>
        ))}
      </ul>
    </div>
  );
}
