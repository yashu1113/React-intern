import { useState } from "react";
import axios from "axios";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await axios.post("/api/auth/register", form);
      setMessage(res.data.message || "Signup successful!");
      setForm({ name: "", email: "", address: "", password: "" });
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Signup failed. Please check your input and try again."
      );
    }
  };

  return (
    <div>
      <h1>Signup Page</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "0 auto" }}>
        <div>
          <label>Name:</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            minLength={20}
            maxLength={60}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Address:</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            maxLength={400}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            maxLength={16}
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      {message && <div style={{ color: "green", marginTop: 10 }}>{message}</div>}
      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
    </div>
  );
}

export default Signup;