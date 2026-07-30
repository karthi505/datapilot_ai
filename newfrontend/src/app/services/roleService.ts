// services/roleService.ts
import { Role } from "../types";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/admin/role-management`;
const DB_API_BASE_URL = `${import.meta.env.VITE_API_URL}/database`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface BackendRole {
  id: string;
  roleName: string;
  description?: string;
  tableAccess: string[];
  assignedUsers?: number | Array<unknown>;
  createdAt: string;
}

function transformRole(role: BackendRole): Role {
  return {
    id: role.id,
    name: role.roleName,
    description: role.description || "",
    permissions: role.tableAccess.reduce(
      (acc: Record<string, boolean>, table: string) => {
        acc[table] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
    assignedUsers: Array.isArray(role.assignedUsers)
      ? role.assignedUsers.length
      : role.assignedUsers || 0,
    createdAt: role.createdAt,
  };
}

export const roleService = {
  // Get all roles
  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status}`);
      }

      const data: ApiResponse<BackendRole[]> = await response.json();

      if (data.success && data.data) {
        return data.data.map(transformRole);
      }

      return [];
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  },

  // Get single role by ID
  getRoleById: async (roleId: string): Promise<Role | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch role: ${response.status}`);
      }

      const data: ApiResponse<BackendRole> = await response.json();

      if (data.success && data.data) {
        return transformRole(data.data);
      }

      return null;
    } catch (error) {
      console.error("Error fetching role:", error);
      return null;
    }
  },

  // Create a new role
  addRole: async (
    name: string,
    description: string,
    permissions: Record<string, boolean>,
  ): Promise<{ success: boolean; message: string; data?: Role }> => {
    try {
      const tableAccess = Object.entries(permissions)
        .filter(([_, hasAccess]) => hasAccess)
        .map(([table]) => table);

      const response = await fetch(`${API_BASE_URL}/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          roleName: name,
          description,
          tableAccess,
        }),
      });

      const data: ApiResponse<BackendRole> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to create role: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
        data: data.data ? transformRole(data.data) : undefined,
      };
    } catch (error) {
      console.error("Error creating role:", error);
      return {
        success: false,
        message: "Server error while creating role",
      };
    }
  },

  // Update a role
  updateRole: async (
    roleId: string,
    name: string,
    description: string,
    permissions: Record<string, boolean>,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const tableAccess = Object.entries(permissions)
        .filter(([_, hasAccess]) => hasAccess)
        .map(([table]) => table);

      const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          roleName: name,
          description,
          tableAccess,
        }),
      });

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to update role: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error updating role:", error);
      return {
        success: false,
        message: "Server error while updating role",
      };
    }
  },

  // Delete a role
  deleteRole: async (
    roleId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to delete role: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error deleting role:", error);
      return {
        success: false,
        message: "Server error while deleting role",
      };
    }
  },

  // Get available database tables
  getAvailableTables: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/available-tables`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.status}`);
      }

      const data: ApiResponse<string[]> = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
      console.error("Error fetching available tables:", error);
      return [];
    }
  },

  // Get role statistics
  getRoleStats: async (): Promise<{
    total: number;
    assigned: number;
    unassigned: number;
  } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data: ApiResponse<{ total: number; assigned: number; unassigned: number }> = await response.json();
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error("Error fetching role stats:", error);
      return null;
    }
  },

  // Get table data for DatabaseViewer
  getTableData: async (
    tableName: string,
  ): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> => {
    try {
      const response = await fetch(
        `${DB_API_BASE_URL}/tables/${encodeURIComponent(tableName)}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch table data: ${response.status}`);
      }

      const data = await response.json();

      if (data.data?.columns && data.data?.rows) {
        return { columns: data.data.columns, rows: data.data.rows };
      }

      if (data.columns && data.rows) {
        return { columns: data.columns, rows: data.rows };
      }

      throw new Error("Unexpected response format from server");
    } catch (error) {
      console.error("Error fetching table data:", error);
      throw error;
    }
  },

  // Initialize role permissions based on database tables
  initializeRolePermissions: (tables: string[]): Record<string, boolean> => {
    return tables.reduce(
      (acc, table) => {
        acc[table] = false;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  },
};