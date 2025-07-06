import { pool } from "../models/db.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getStores = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Allowed sort fields
    const allowedSort = ["name", "email", "rating"];
    const allowedOrder = ["asc", "desc"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "name";
    const order = allowedOrder.includes(sortOrder.toLowerCase())
      ? sortOrder
      : "asc";

    // Build filters
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

    let whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // Query: assumes 'stores' table has columns: name, email, address, rating
    const query = `
      SELECT name, email, address, rating
      FROM stores
      ${whereClause}
      ORDER BY ${sortField} ${order.toUpperCase()}
    `;

    const result = await pool.query(query, values);

    res.json({ stores: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getStoresWithRatings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all stores
    const storesResult = await pool.query(
      "SELECT id, name, address FROM stores"
    );
    const stores = storesResult.rows;

    // For all store IDs, get average ratings and user's rating in a single query
    const storeIds = stores.map((s) => s.id);
    let avgRatings = [];
    let userRatings = [];

    if (storeIds.length > 0) {
      // Get average ratings for all stores
      const avgResult = await pool.query(
        `SELECT store_id, AVG(rating)::numeric(2,1) as avg_rating
         FROM ratings
         WHERE store_id = ANY($1)
         GROUP BY store_id`,
        [storeIds]
      );
      avgRatings = avgResult.rows;

      // Get user's ratings for all stores
      const userResult = await pool.query(
        `SELECT store_id, rating FROM ratings WHERE user_id = $1 AND store_id = ANY($2)`,
        [userId, storeIds]
      );
      userRatings = userResult.rows;
    }

    // Map ratings for quick lookup
    const avgMap = {};
    avgRatings.forEach((r) => {
      avgMap[r.store_id] = Number(r.avg_rating);
    });
    const userMap = {};
    userRatings.forEach((r) => {
      userMap[r.store_id] = r.rating;
    });

    // Build response
    const result = stores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      averageRating: avgMap[store.id] || 0,
      yourRating: userMap[store.id] || null,
    }));

    res.json({ stores: result });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Store owner dashboard: see users who rated their store and average rating
export const getStoreOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Find the store owned by this user
    const storeResult = await pool.query(
      "SELECT id, name, address FROM stores WHERE owner_id = $1",
      [ownerId]
    );
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: "No store found for this owner" });
    }
    const store = storeResult.rows[0];

    // Get all ratings for this store, joined with user info
    const ratingsResult = await pool.query(
      `SELECT u.id as user_id, u.name as user_name, u.email, r.rating
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = $1`,
      [store.id]
    );

    // Get average rating for this store
    const avgResult = await pool.query(
      "SELECT AVG(rating)::numeric(2,1) as avg_rating FROM ratings WHERE store_id = $1",
      [store.id]
    );
    const avgRating = avgResult.rows[0].avg_rating || 0;

    res.json({
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        averageRating: Number(avgRating),
      },
      ratings: ratingsResult.rows, // array of {user_id, user_name, email, rating}
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const addStoreByAdmin = async (req, res) => {
  try {
    const { name, email, address } = req.body;
    if (!name || !email || !address) {
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
    // Check if email exists
    const existing = await pool.query("SELECT * FROM stores WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Store email already registered" });
    }
    await pool.query(
      "INSERT INTO stores (name, email, address) VALUES ($1, $2, $3)",
      [name, email, address]
    );
    res.status(201).json({ message: "Store added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
