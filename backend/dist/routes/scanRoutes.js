// routes/scanRoutes.js
import express from "express";
import { triggerScan, getScanStatus } from "../controllers/scanController.js";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(isAdmin);

router.post("/trigger", triggerScan);
router.get("/status", getScanStatus);

export default router;
