import express from "express";
import {
  deleteReview,
  deleteReviewsBatch,
  getReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

// List/filter/paginate reviews
router.get("/", getReviews);

// Batch delete reviews (placed before single delete)
router.delete("/batch", deleteReviewsBatch);

// Delete single review
router.delete("/:id", deleteReview);


export default router;
