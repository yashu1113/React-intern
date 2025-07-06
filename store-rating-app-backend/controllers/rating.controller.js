import { pool } from "../models/db.js";

// Submit or update a rating
export const submitOrUpdateRating = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { store_id, rating } = req.body;

    // Validate rating
    if (!store_id || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: "store_id and rating (1-5) required" });
    }

    // Check if a rating by this user for this store exists
    const existing = await pool.query(
      "SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2",
      [user_id, store_id]
    );

    if (existing.rows.length > 0) {
      // Update existing rating
      await pool.query(
        "UPDATE ratings SET rating = $1 WHERE user_id = $2 AND store_id = $3",
        [rating, user_id, store_id]
      );
      return res.json({ message: "Rating updated" });
    } else {
      // Insert new rating
      await pool.query(
        "INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)",
        [user_id, store_id, rating]
      );
      return res.json({ message: "Rating submitted" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

// Get store rating info for a user
export const getStoreRatingInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: "storeId is required" });
    }

    // Get store info
    const storeResult = await pool.query(
      "SELECT id, name, address FROM stores WHERE id = $1",
      [storeId]
    );
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }
    const store = storeResult.rows[0];

    // Get average rating
    const avgResult = await pool.query(
      "SELECT AVG(rating)::numeric(2,1) as avg_rating FROM ratings WHERE store_id = $1",
      [storeId]
    );
    const avgRating = avgResult.rows[0].avg_rating || 0;

    // Get user's rating
    const userRatingResult = await pool.query(
      "SELECT rating FROM ratings WHERE user_id = $1 AND store_id = $2",
      [userId, storeId]
    );
    const userRating =
      userRatingResult.rows.length > 0 ? userRatingResult.rows[0].rating : null;

    res.json({
      storeName: store.name,
      address: store.address,
      averageRating: Number(avgRating),
      yourRating: userRating,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
