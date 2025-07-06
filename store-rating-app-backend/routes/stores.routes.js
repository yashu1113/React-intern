import express from "express";
import {
  getStores,
  getStoresWithRatings,
  getStoreOwnerDashboard,
} from "../controllers/store.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// User-facing: list all stores with ratings
router.get("/user-list", authenticateJWT, getStoresWithRatings);

// Store owner dashboard
router.get(
  "/owner-dashboard",
  authenticateJWT,
  authorizeRoles("store_owner"),
  getStoreOwnerDashboard
);

// Admin-only: filtered/sorted list
router.get("/", authenticateJWT, authorizeRoles("admin"), getStores);

export default router;
