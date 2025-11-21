import express from "express";
import {
  analyzeReviews,
  deleteReview,
  deleteReviewsBatch,
  getReviews,
} from "../controllers/reviewController.js";
import { verifyAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protect all review routes
router.use(verifyAuth);

// List/filter/paginate reviews
router.get("/", getReviews);

// Batch delete reviews (placed before single delete)
router.delete("/batch", deleteReviewsBatch);

// Delete single review
router.delete("/:id", deleteReview);


export default router;
