// controllers/roleManagementController.js
import { prisma } from '../../lib/prisma.js';

/**
 * @route   POST /api/admin/role-management/create
 * @desc    Create a new custom role with table permissions
 * @access  Admin
 */
export const createRole = async (req, res) => {
  try {
    const { roleName, description, tableAccess } = req.body;
    const adminCompanyId = req.user.companyId;

    // Validation
    if (!roleName || !roleName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    if (!tableAccess || !Array.isArray(tableAccess) || tableAccess.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one table must be selected'
      });
    }

    // Check if role already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        companyId: adminCompanyId,
        roleName: roleName.trim()
      }
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create role with permissions
    const newRole = await prisma.role.create({
      data: {
        companyId: adminCompanyId,
        roleName: roleName.trim(),
        description: description?.trim() || null,
        rolePermissions: {
          create: tableAccess.map(tableName => ({
            tableName: tableName,
            allowedColumns: ['*'], // All columns by default
            rowFilter: null
          }))
        }
      },
      include: {
        rolePermissions: {
          select: {
            id: true,
            tableName: true,
            allowedColumns: true,
            rowFilter: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: {
        id: newRole.id,
        roleName: newRole.roleName,
        description: newRole.description,
        tableAccess: newRole.rolePermissions.map(p => p.tableName),
        createdAt: newRole.createdAt
      }
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/role-management/roles
 * @desc    Get all custom roles with their permissions
 * @access  Admin
 */
export const getAllRoles = async (req, res) => {
  try {
    const adminCompanyId = req.user.companyId;
    const { status } = req.query; // 'active' or 'inactive' filter

    const whereClause = {
      companyId: adminCompanyId
    };

    // Note: Add isActive field to roles table if you want active/inactive filtering
    // For now, we'll return all roles

    const roles = await prisma.role.findMany({
      where: whereClause,
      include: {
        rolePermissions: {
          select: {
            id: true,
            tableName: true,
            allowedColumns: true,
            rowFilter: true
          }
        },
        _count: {
          select: {
            userRoles: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response to match UI
    const formattedRoles = roles.map(role => ({
      id: role.id,
      roleName: role.roleName,
      description: role.description,
      tableAccess: role.rolePermissions.map(perm => perm.tableName),
      assignedUsers: role._count.userRoles,
      createdAt: role.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedRoles.length,
      data: formattedRoles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/role-management/roles/:roleId
 * @desc    Get single role with details
 * @access  Admin
 */
export const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    const adminCompanyId = req.user.companyId;

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        companyId: adminCompanyId
      },
      include: {
        rolePermissions: {
          select: {
            id: true,
            tableName: true,
            allowedColumns: true,
            rowFilter: true
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const formattedRole = {
      id: role.id,
      roleName: role.roleName,
      description: role.description,
      tableAccess: role.rolePermissions.map(perm => perm.tableName),
      permissions: role.rolePermissions,
      assignedUsers: role.userRoles.map(ur => ({
        userId: ur.user.id,
        name: ur.user.name,
        email: ur.user.email,
        userType: ur.user.userType,
        isActive: ur.user.isActive,
        assignedAt: ur.assignedAt
      })),
      createdAt: role.createdAt
    };

    res.status(200).json({
      success: true,
      data: formattedRole
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/admin/role-management/roles/:roleId
 * @desc    Update role and its permissions
 * @access  Admin
 */
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { roleName, description, tableAccess } = req.body;
    const adminCompanyId = req.user.companyId;

    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        companyId: adminCompanyId
      }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if new name conflicts with existing role
    if (roleName && roleName.trim() !== existingRole.roleName) {
      const nameConflict = await prisma.role.findFirst({
        where: {
          companyId: adminCompanyId,
          roleName: roleName.trim(),
          id: { not: roleId }
        }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Another role with this name already exists'
        });
      }
    }

    // Update table access if provided
    if (tableAccess && Array.isArray(tableAccess)) {
      if (tableAccess.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one table must be selected'
        });
      }

      // Delete old permissions
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: roleId
        }
      });

      // Create new permissions
      await prisma.rolePermission.createMany({
        data: tableAccess.map(tableName => ({
          roleId: roleId,
          tableName: tableName,
          allowedColumns: ['*'],
          rowFilter: null
        }))
      });
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: {
        id: roleId
      },
      data: {
        ...(roleName && { roleName: roleName.trim() }),
        ...(description !== undefined && { description: description?.trim() || null })
      },
      include: {
        rolePermissions: {
          select: {
            id: true,
            tableName: true,
            allowedColumns: true,
            rowFilter: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: {
        id: updatedRole.id,
        roleName: updatedRole.roleName,
        description: updatedRole.description,
        tableAccess: updatedRole.rolePermissions.map(perm => perm.tableName)
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/admin/role-management/roles/:roleId
 * @desc    Delete a role
 * @access  Admin
 */
export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const adminCompanyId = req.user.companyId;

    // Check if role exists
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        companyId: adminCompanyId
      },
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if role is assigned to users
    if (role._count.userRoles > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. It is assigned to ${role._count.userRoles} user(s). Please unassign first.`
      });
    }

    // Delete role (cascade will delete role_permissions)
    await prisma.role.delete({
      where: {
        id: roleId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/role-management/available-tables
 * @desc    Get list of available database tables from connected database
 * @access  Admin
 */
export const getAvailableTables = async (req, res) => {
  try {
    const adminCompanyId = req.user.companyId;

    // Get the database connection for this company
    const dbConnection = await prisma.databaseConnection.findFirst({
      where: {
        companyId: adminCompanyId,
        isActive: true
      }
    });

    if (!dbConnection) {
      return res.status(404).json({
        success: false,
        message: 'No active database connection found. Please connect your database first.',
        data: []
      });
    }

    // Extract table names from schema snapshot
    let tables = [];

    if (!dbConnection.schemaSnapshot) {
      return res.status(200).json({
        success: true,
        message: 'No schema snapshot available',
        data: []
      });
    }

    // Parse schema snapshot
    try {
      let schemaData = dbConnection.schemaSnapshot;

      // If it's a string, parse it
      if (typeof schemaData === 'string') {
        schemaData = JSON.parse(schemaData);
      }

      // Extract table names
      if (schemaData.tables && Array.isArray(schemaData.tables)) {
        tables = schemaData.tables.map(t => t.name || t.table_name || t.tableName).filter(Boolean);
      } else if (schemaData.schema && typeof schemaData.schema === 'string') {
        // If schema is stored as a string, try to extract table names
        tables = [schemaData.schema];
      }
    } catch (parseError) {
      console.error('Schema parse error:', parseError);
      // Return default tables if parsing fails
      tables = [
        'users', 'customers', 'orders', 'products', 
        'invoices', 'payments', 'reports', 'analytics',
        'employees', 'departments'
      ];
    }

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error('Get available tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available tables',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/role-management/stats
 * @desc    Get role statistics
 * @access  Admin
 */
export const getRoleStats = async (req, res) => {
  try {
    const adminCompanyId = req.user.companyId;

    const totalRoles = await prisma.role.count({
      where: { companyId: adminCompanyId }
    });

    const rolesWithUsers = await prisma.role.findMany({
      where: { companyId: adminCompanyId },
      include: {
        _count: {
          select: { userRoles: true }
        }
      }
    });

    const assignedRoles = rolesWithUsers.filter(r => r._count.userRoles > 0).length;
    const unassignedRoles = rolesWithUsers.filter(r => r._count.userRoles === 0).length;

    res.status(200).json({
      success: true,
      data: {
        total: totalRoles,
        assigned: assignedRoles,
        unassigned: unassignedRoles
      }
    });
  } catch (error) {
    console.error('Get role stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role statistics',
      error: error.message
    });
  }
};