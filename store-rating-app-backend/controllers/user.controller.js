import bcrypt from "bcryptjs";
import { pool } from "../models/db.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const addUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Validation
    if (!name || !email || !password || !address || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (name.length < 20 || name.length > 60) {
      return res
        .status(400)
        .json({ error: "Name must be 20-60 characters long" });
    }
    if (address.length > 400) {
      return res
        .status(400)
        .json({ error: "Address must be at most 400 characters" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9])[\S]{8,16}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be 8-16 characters, include 1 uppercase & 1 special character",
      });
    }
    if (!["user", "admin", "store_owner"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if email exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5)",
      [name, email, hashedPassword, address, role]
    );

    res.status(201).json({ message: "User added successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both old and new passwords required" });
    }

    // Get current password hash
    const userResult = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];

    // Check old password
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    // Validate new password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9])[\S]{8,16}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be 8-16 characters, include 1 uppercase & 1 special character",
      });
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashed,
      userId,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const listUsers = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      role,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;
    const allowedSort = ["name", "email", "address", "role"];
    const allowedOrder = ["asc", "desc"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "name";
    const order = allowedOrder.includes(sortOrder.toLowerCase())
      ? sortOrder
      : "asc";

    let filters = [];
    let values = [];
    let idx = 1;

    if (name) {
      filters.push(`name ILIKE $${idx++}`);
      values.push(`%${name}%`);
    }
    if (email) {
      filters.push(`email ILIKE $${idx++}`);
      values.push(`%${email}%`);
    }
    if (address) {
      filters.push(`address ILIKE $${idx++}`);
      values.push(`%${address}%`);
    }
    if (role) {
      filters.push(`role = $${idx++}`);
      values.push(role);
    }

    let whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const query = `
      SELECT id, name, email, address, role
      FROM users
      ${whereClause}
      ORDER BY ${sortField} ${order.toUpperCase()}
    `;

    const result = await pool.query(query, values);
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    const userResult = await pool.query(
      "SELECT id, name, email, address, role FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];

    // If store owner, get their store and average rating
    let storeInfo = null;
    if (user.role === "store_owner") {
      const storeResult = await pool.query(
        "SELECT id, name, address FROM stores WHERE owner_id = $1",
        [userId]
      );
      if (storeResult.rows.length > 0) {
        const store = storeResult.rows[0];
        const avgResult = await pool.query(
          "SELECT AVG(rating)::numeric(2,1) as avg_rating FROM ratings WHERE store_id = $1",
          [store.id]
        );
        storeInfo = {
          ...store,
          averageRating: avgResult.rows[0].avg_rating || 0,
        };
      }
    }

    res.json({ user, store: storeInfo });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
