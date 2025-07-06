import express from "express";
import {
  addUserByAdmin,
  listUsers,
  getUserDetail,
} from "../controllers/user.controller.js";
import { addStoreByAdmin } from "../controllers/store.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Add user (admin only)
router.post("/users", authenticateJWT, authorizeRoles("admin"), addUserByAdmin);

// Add store (admin only)
router.post(
  "/stores",
  authenticateJWT,
  authorizeRoles("admin"),
  addStoreByAdmin
);

// List users with filters and sorting (admin only)
router.get("/users", authenticateJWT, authorizeRoles("admin"), listUsers);

// Get user detail (admin only)
router.get(
  "/users/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  getUserDetail
);

export default router;
