import express from "express";
import { pool } from "./models/db.js";
import dotenv from "dotenv";
import authroutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import storesRoutes from "./routes/stores.routes.js";
import ratingsRoutes from "./routes/ratings.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use("/api/auth", authroutes);
app.use("/api/users", usersRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res
      .status(500)
      .json({ error: "DB connection failed", detail: err.message });
  }
});

app.get("/api/protected", authenticateJWT, (req, res) => {
  res.json({ message: "Protected route accessed!", user: req.user });
});

app.get(
  "/api/admin-only",
  authenticateJWT,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Hello Admin!", user: req.user });
  }
);

app.get(
  "/api/store-owner-only",
  authenticateJWT,
  authorizeRoles("store_owner"),
  (req, res) => {
    res.json({ message: "Hello Store Owner!", user: req.user });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
