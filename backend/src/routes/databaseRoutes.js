// routes/databaseConnectionRoutes.js
import express from "express";

import { authenticate, isAdmin } from "../middleware/authMiddleware.js";
import {
  createConnectionAutomatic,
  createConnectionManual,
  deleteConnection,
  getConnection,
  testConnection,
  updateConnection,
  getTableData,
} from "../controllers/databaseControllers/databaseController.js";

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Connection CRUD - ONE per company
router.post("/connection/automatic", createConnectionAutomatic);
router.post("/connection/manual", createConnectionManual);
router.get("/connection", getConnection);
router.put("/connection", updateConnection);
router.delete("/connection", deleteConnection);

// Connection operations
router.post("/connection/test", testConnection);
// router.post('/connection/refresh', refreshConnection);
// router.get('/connection/status', getConnectionStatus);
// router.post('/connection/preview-schema', previewAutomaticSchema);

router.get("/tables/:tableName", getTableData);

export default router;
