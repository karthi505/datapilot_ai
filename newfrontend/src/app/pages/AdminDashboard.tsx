import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Header } from "../components/shared/Header";
import { DatabaseConnection } from "../components/admin/DatabaseConnection";
import { StatsCards } from "../components/admin/StatsCards";
import { EmployeeManagement } from "../components/admin/EmployeeManagement";
import { RoleManagement } from "../components/admin/RoleManagement";
import { employeeService } from "../services/employeeService";
import { roleService } from "../services/roleService";
import { User, Employee, Role } from "../types";
import { DatabaseViewer } from "../components/admin/DatabaseViewer";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [databaseTables, setDatabaseTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [showDatabaseViewer, setShowDatabaseViewer] = useState(false);

  // Load initial data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesData, rolesData, availableRoles, statsData, tablesData] =
        await Promise.all([
          employeeService.getEmployees(),
          roleService.getRoles(),
          employeeService.getAvailableRoles(),
          employeeService.getEmployeeStats(),
          roleService.getAvailableTables(),
        ]);

      setEmployees(employeesData);
      setRoles(rolesData);
      setDatabaseTables(tablesData);

      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Employee handlers
  const handleAddEmployee = async (
    name: string,
    email: string,
    password: string,
    roleId?: string,
  ) => {
    const result = await employeeService.addEmployee(
      name,
      email,
      password,
      roleId,
    );

    if (result.success) {
      alert(result.message);
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleUpdateEmployee = async (
    id: string,
    updates: { name?: string; email?: string; password?: string },
  ) => {
    const result = await employeeService.updateEmployee(id, updates);

    if (result.success) {
      alert(result.message);
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    const result = await employeeService.deleteEmployee(id);

    if (result.success) {
      alert(result.message);
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const result = await employeeService.toggleEmployeeStatus(id);

    if (result.success) {
      alert(result.message);
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleAssignRole = async (employeeId: string, roleId: string) => {
    const result = await employeeService.assignEmployeeRole(employeeId, roleId);

    if (result.success) {
      alert(result.message);
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  // Role handlers
  const handleAddRole = async (
    name: string,
    description: string,
    permissions: Record<string, boolean>,
  ) => {
    const result = await roleService.addRole(name, description, permissions);

    if (result.success) {
      alert(result.message);
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleUpdateRole = async (
    roleId: string,
    name: string,
    description: string,
    permissions: Record<string, boolean>,
  ) => {
    const result = await roleService.updateRole(
      roleId,
      name,
      description,
      permissions,
    );

    if (result.success) {
      alert(result.message);
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this role? This action cannot be undone.",
      )
    ) {
      return;
    }

    const result = await roleService.deleteRole(id);

    if (result.success) {
      alert(result.message);
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  // Database handlers
  const handleTablesLoaded = (tables: string[]) => {
    setDatabaseTables(tables);
  };

  if (showDatabaseViewer) {
    return (
      <DatabaseViewer
        onBack={() => setShowDatabaseViewer(false)}
        databaseTables={databaseTables}
      />
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Admin Dashboard"
        userName={user.name}
        onLogout={onLogout}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Database Connection - Priority Section */}
          <DatabaseConnection
            onTablesLoaded={handleTablesLoaded}
            onViewDatabase={() => setShowDatabaseViewer(true)}
            tablesCount={databaseTables.length}
          />

          {/* Stats */}
          <StatsCards employees={employees} />

          {/* Role & Employee Management Tabs */}
          <Tabs defaultValue="employees" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="employees">Employee Management</TabsTrigger>
              <TabsTrigger value="roles">Role Management</TabsTrigger>
            </TabsList>

            <TabsContent value="employees">
              <EmployeeManagement
                employees={employees}
                roles={roles}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onToggleStatus={handleToggleStatus}
                onAssignRole={handleAssignRole}
              />
            </TabsContent>

            <TabsContent value="roles">
              <RoleManagement
                roles={roles}
                databaseTables={databaseTables}
                onAddRole={handleAddRole}
                onUpdateRole={handleUpdateRole}
                onDeleteRole={handleDeleteRole}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
