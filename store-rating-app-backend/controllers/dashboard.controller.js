import { pool } from "../models/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Count users
    const usersResult = await pool.query("SELECT COUNT(*) FROM users");
    // Count stores (assuming you have a 'stores' table)
    const storesResult = await pool.query("SELECT COUNT(*) FROM stores");
    // Count ratings (assuming you have a 'ratings' table)
    const ratingsResult = await pool.query("SELECT COUNT(*) FROM ratings");

    res.json({
      totalUsers: parseInt(usersResult.rows[0].count, 10),
      totalStores: parseInt(storesResult.rows[0].count, 10),
      totalRatings: parseInt(ratingsResult.rows[0].count, 10),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
