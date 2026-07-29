import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getQueryHistory,
  submitQuery,
} from "../controllers/queryController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Submit new query
router.post("/submit", submitQuery);

// Get query history for current user
router.get("/history", getQueryHistory);

// // Get specific query details
// router.get('/:id', getQueryDetails);

// // Re-execute a previously generated query
// router.post('/:id/execute', reExecuteQuery);

export default router;
