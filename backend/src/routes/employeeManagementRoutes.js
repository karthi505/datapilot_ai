// routes/employeeManagementRoutes.js
import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  assignEmployeeRole,
  toggleEmployeeStatus,
  updateEmployee,
  deleteEmployee,
  getAvailableRoles,
  getEmployeeStats
} from '../controllers/userControllers/employeeManagementController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticate);
router.use(isAdmin);

// ==================== EMPLOYEE CRUD ====================

// Get all employees with their assigned custom roles
router.get('/employeelist', getAllEmployees);

// Get single employee with full details
router.get('/fetch_single_employee/:id', getEmployeeById);

// Add new employee
router.post('/add', addEmployee);

// Update employee details (name, email, password)
router.put('/update/:id', updateEmployee);

// Delete employee
router.delete('/delete/:id', deleteEmployee);

// ==================== ROLE ASSIGNMENT ====================

// Assign or change custom role for employee (for the edit icon ✏️)
router.put('/assign-role/:id', assignEmployeeRole);

// ==================== STATUS MANAGEMENT ====================

// Toggle employee active/inactive status
router.patch('/employees/:id/toggle-status', toggleEmployeeStatus);

// ==================== UTILITIES ====================

// Get all available custom roles for dropdowns
router.get('/available-roles', getAvailableRoles);

// Get employee statistics (total, active, inactive)
router.get('/stats', getEmployeeStats);

export default router;