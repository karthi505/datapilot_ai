// controllers/employeeManagementController.js
import { prisma } from '../../lib/prisma.js';
import bcrypt from 'bcryptjs';

/**
 * Valid UserType enum values from your schema
 * ONLY: ADMIN, EMPLOYEE
 */
const VALID_USER_TYPES = ['ADMIN', 'EMPLOYEE'];

/**
 * @route   GET /api/admin/employee-management/employees
 * @desc    Get all employees with their assigned custom roles
 * @access  Admin
 */
export const getAllEmployees = async (req, res) => {
  try {
    const adminCompanyId = req.user.companyId;

    const employees = await prisma.user.findMany({
      where: {
        companyId: adminCompanyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isActive: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                description: true
              }
            }
          },
          orderBy: {
            assignedAt: 'desc'
          },
          take: 1 // Get the most recently assigned role for display
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response to match UI
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.userRoles.length > 0 ? emp.userRoles[0].role.roleName : 'No Role',
      roleId: emp.userRoles.length > 0 ? emp.userRoles[0].role.id : null,
      status: emp.isActive ? 'active' : 'inactive',
      userType: emp.userType,
      createdAt: emp.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedEmployees.length,
      data: formattedEmployees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/employee-management/employees/:id
 * @desc    Get single employee with all assigned roles
 * @access  Admin
 */
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminCompanyId = req.user.companyId;

    const employee = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: adminCompanyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                description: true,
                rolePermissions: {
                  select: {
                    tableName: true,
                    allowedColumns: true,
                    rowFilter: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/admin/employee-management/add
 * @desc    Add new employee
 * @access  Admin
 */
export const addEmployee = async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;
    const adminCompanyId = req.user.companyId;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - ONLY use EMPLOYEE (valid enum value)
    const newEmployee = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        name: name.trim(),
        companyId: adminCompanyId,
        userType: 'EMPLOYEE', // ✅ ONLY EMPLOYEE (valid enum)
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isActive: true,
        createdAt: true
      }
    });

    // If roleId provided, assign role
    let assignedRole = null;
    if (roleId) {
      // Verify role exists and belongs to company
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          companyId: adminCompanyId
        }
      });

      if (role) {
        assignedRole = await prisma.userRole.create({
          data: {
            userId: newEmployee.id,
            roleId: roleId
          },
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                description: true
              }
            }
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      data: {
        id: newEmployee.id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: assignedRole ? assignedRole.role.roleName : 'No Role',
        roleId: assignedRole ? assignedRole.role.id : null,
        status: newEmployee.isActive ? 'active' : 'inactive',
        userType: newEmployee.userType,
        createdAt: newEmployee.createdAt
      }
    });
  } catch (error) {
    console.error('Add employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add employee',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/admin/employee-management/employees/:id/assign-role
 * @desc    Assign or change custom role for employee
 * @access  Admin
 */
export const assignEmployeeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    const adminCompanyId = req.user.companyId;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required'
      });
    }

    // Verify employee exists and belongs to company
    const employee = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: adminCompanyId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Verify role exists and belongs to company
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        companyId: adminCompanyId
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Remove all existing role assignments for this user
    await prisma.userRole.deleteMany({
      where: {
        userId: id
      }
    });

    // Assign new role
    const assignment = await prisma.userRole.create({
      data: {
        userId: id,
        roleId: roleId
      },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            description: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Role "${role.roleName}" assigned to ${employee.name}`,
      data: {
        userId: id,
        userName: employee.name,
        role: assignment.role.roleName,
        roleId: assignment.role.id
      }
    });
  } catch (error) {
    console.error('Assign employee role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign role',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/admin/employee-management/employees/:id/toggle-status
 * @desc    Toggle employee active/inactive status
 * @access  Admin
 */
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminCompanyId = req.user.companyId;

    // Get current employee
    const employee = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: adminCompanyId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (employee.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    // Toggle status
    const updatedEmployee = await prisma.user.update({
      where: {
        id: id
      },
      data: {
        isActive: !employee.isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Employee ${updatedEmployee.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: updatedEmployee.id,
        name: updatedEmployee.name,
        status: updatedEmployee.isActive ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Toggle employee status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle employee status',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/admin/employee-management/employees/:id
 * @desc    Update employee details
 * @access  Admin
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const adminCompanyId = req.user.companyId;

    // Check if employee exists
    const employee = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: adminCompanyId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Prepare update data
    const updateData = {};

    if (email) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check if email already exists for different user
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          id: { not: id }
        }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user'
        });
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (name) {
      updateData.name = name.trim();
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update employee
    const updatedEmployee = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isActive: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/admin/employee-management/employees/:id
 * @desc    Delete employee
 * @access  Admin
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const adminCompanyId = req.user.companyId;

    // Check if employee exists
    const employee = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: adminCompanyId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Prevent admin from deleting themselves
    if (employee.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete employee (cascade will delete user_roles)
    await prisma.user.delete({
      where: { id: id }
    });

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/employee-management/available-roles
 * @desc    Get all available custom roles for assignment
 * @access  Admin
 */
export const getAvailableRoles = async (req, res) => {
  try {
    const adminCompanyId = req.user.companyId;

    const roles = await prisma.role.findMany({
      where: {
        companyId: adminCompanyId
      },
      select: {
        id: true,
        roleName: true,
        description: true
      },
      orderBy: {
        roleName: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error('Get available roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available roles',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/employee-management/stats
 * @desc    Get employee statistics
 * @access  Admin
 */
export const getEmployeeStats = async (req, res) => {
  try {
    const adminCompanyId = req.user.companyId;

    const totalEmployees = await prisma.user.count({
      where: { companyId: adminCompanyId }
    });

    const activeEmployees = await prisma.user.count({
      where: {
        companyId: adminCompanyId,
        isActive: true
      }
    });

    const inactiveEmployees = await prisma.user.count({
      where: {
        companyId: adminCompanyId,
        isActive: false
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees
      }
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee statistics',
      error: error.message
    });
  }
};