import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../models/db.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    // Validation
    if (!name || !email || !password || !address) {
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

    // Check if email exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, address) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, address]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = userResult.rows[0];

    // Compare password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login success", token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
