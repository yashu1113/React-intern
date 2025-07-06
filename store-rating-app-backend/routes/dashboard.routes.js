import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/stats",
  authenticateJWT,
  authorizeRoles("admin"),
  getDashboardStats
);

export default router;
