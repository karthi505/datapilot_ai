// routes/roleManagementRoutes.js
import express from 'express';
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getAvailableTables,
  getRoleStats
} from '../controllers/userControllers/roleManagementController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication and admin-only middleware to all routes
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   POST /api/admin/role-management/create
 * @desc    Create a new custom role with table permissions
 * @access  Admin only
 */
router.post('/create', createRole);

/**
 * @route   GET /api/admin/role-management/roles
 * @desc    Get all custom roles with their permissions
 * @access  Admin only
 */
router.get('/roles', getAllRoles);

/**
 * @route   GET /api/admin/role-management/roles/:roleId
 * @desc    Get single role with full details
 * @access  Admin only
 */
router.get('/roles/:roleId', getRoleById);

/**
 * @route   PUT /api/admin/role-management/roles/:roleId
 * @desc    Update role and its permissions
 * @access  Admin only
 */
router.put('/roles/:roleId', updateRole);

/**
 * @route   DELETE /api/admin/role-management/roles/:roleId
 * @desc    Delete a role (if not assigned to users)
 * @access  Admin only
 */
router.delete('/roles/:roleId', deleteRole);

/**
 * @route   GET /api/admin/role-management/available-tables
 * @desc    Get list of available tables from connected database
 * @access  Admin only
 */
router.get('/available-tables', getAvailableTables);

/**
 * @route   GET /api/admin/role-management/stats
 * @desc    Get role statistics (total, assigned, unassigned)
 * @access  Admin only
 */
router.get('/stats', getRoleStats);

export default router;