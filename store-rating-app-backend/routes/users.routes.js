import express from "express";
import {
  addUserByAdmin,
  updatePassword,
} from "../controllers/user.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/add", authenticateJWT, authorizeRoles("admin"), addUserByAdmin);

// Any authenticated user can update their password
router.post("/update-password", authenticateJWT, updatePassword);

export default router;
