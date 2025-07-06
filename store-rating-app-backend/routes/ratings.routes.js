import express from "express";
import {
  submitOrUpdateRating,
  getStoreRatingInfo,
} from "../controllers/rating.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateJWT, submitOrUpdateRating);
router.get("/", authenticateJWT, getStoreRatingInfo);

export default router;
