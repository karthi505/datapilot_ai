// services/employeeService.ts
import { Employee } from "../types";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/admin/employee-management`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const employeeService = {
  // Get all employees
  getEmployees: async (): Promise<Employee[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/employeelist`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }

      const data: ApiResponse<Employee[]> = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  },

  // Get single employee by ID
  getEmployeeById: async (id: string): Promise<Employee | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/fetch_single_employee/${id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch employee: ${response.status}`);
      }

      const data: ApiResponse<Employee> = await response.json();
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error("Error fetching employee:", error);
      return null;
    }
  },

  // Add a new employee
  addEmployee: async (
    name: string,
    email: string,
    password: string,
    roleId?: string,
  ): Promise<{ success: boolean; message: string; data?: Employee }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, email, password, roleId }),
      });

      const data: ApiResponse<Employee> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to add employee: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
        data: data.data,
      };
    } catch (error) {
      console.error("Error adding employee:", error);
      return {
        success: false,
        message: "Server error while adding employee",
      };
    }
  },

  // Update employee details
  updateEmployee: async (
    id: string,
    updates: { name?: string; email?: string; password?: string },
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/update/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to update employee: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error updating employee:", error);
      return {
        success: false,
        message: "Server error while updating employee",
      };
    }
  },

  // Delete an employee
  deleteEmployee: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to delete employee: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error deleting employee:", error);
      return {
        success: false,
        message: "Server error while deleting employee",
      };
    }
  },

  // Toggle employee status
    toggleEmployeeStatus: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/employees/${id}/toggle-status`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to toggle status: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error toggling employee status:", error);
      return {
        success: false,
        message: "Server error while toggling status",
      };
    }
  },

  // Assign role to employee
  assignEmployeeRole: async (
    id: string,
    roleId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/assign-role/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ roleId }),
      });

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to assign role: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error assigning role:", error);
      return {
        success: false,
        message: "Server error while assigning role",
      };
    }
  },

  // Get available roles
  getAvailableRoles: async (): Promise<
    Array<{ id: string; roleName: string; description: string }>
  > => {
    try {
      const response = await fetch(`${API_BASE_URL}/available-roles`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status}`);
      }

      const data: ApiResponse<Array<{ id: string; roleName: string; description: string }>> = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
      console.error("Error fetching available roles:", error);
      return [];
    }
  },

  // Get employee statistics
  getEmployeeStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
  } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data: ApiResponse<{ total: number; active: number; inactive: number }> = await response.json();
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error("Error fetching employee stats:", error);
      return null;
    }
  },
};