import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Trash2, Edit2, Power, UserCircle2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Employee, Role } from "../../types";
import { Spinner } from "../ui/spinner";

interface EmployeeManagementProps {
  employees: Employee[];
  roles: Role[];
  onAddEmployee: (
    name: string,
    email: string,
    password: string,
    roleId?: string
  ) => void;
  onUpdateEmployee: (
    id: string,
    updates: { name?: string; email?: string; password?: string }
  ) => void;
  onDeleteEmployee: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onAssignRole: (employeeId: string, roleId: string) => void;
}

export function EmployeeManagement({
  employees,
  roles,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onToggleStatus,
  onAssignRole,
}: EmployeeManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAddEmployee = async () => {
    if (newEmployee.name && newEmployee.email && newEmployee.password) {
      setIsAdding(true);
      try {
        await onAddEmployee(
          newEmployee.name,
          newEmployee.email,
          newEmployee.password,
          newEmployee.roleId || undefined
        );
        setNewEmployee({ name: "", email: "", password: "", roleId: "" });
        setIsAddDialogOpen(false);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleEditDialogOpen = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (editingEmployee) {
      const updates: { name?: string; email?: string; password?: string } = {};

      if (editForm.name !== editingEmployee.name) {
        updates.name = editForm.name;
      }
      if (editForm.email !== editingEmployee.email) {
        updates.email = editForm.email;
      }
      if (editForm.password) {
        updates.password = editForm.password;
      }

      if (Object.keys(updates).length > 0) {
        setIsUpdating(true);
        try {
          await onUpdateEmployee(editingEmployee.id, updates);
        } finally {
          setIsUpdating(false);
        }
      }

      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    }
  };

  const handleRoleChange = (employeeId: string, roleId: string) => {
    onAssignRole(employeeId, roleId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Employee Management</CardTitle>
            <CardDescription className="text-xs">
              Add, edit, and manage employee access
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Create a new employee account and assign a role
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, email: e.target.value })
                    }
                    placeholder="john@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        password: e.target.value,
                      })
                    }
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role (Optional)</Label>
                  <Select
                    value={newEmployee.roleId}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, roleId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddEmployee}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isAdding}
                >
                  {isAdding ? <><Spinner className="mr-2" /> Adding...</> : 'Add Employee'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {employees.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No employees added yet
            </div>
          ) : (
            employees.map((employee) => (
              <div key={employee.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <UserCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium truncate">
                          {employee.name}
                        </h3>
                        <Badge
                          variant={
                            employee.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {employee.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {employee.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={employee.roleId || "none"}
                      onValueChange={(value) => {
                        if (value !== "none") {
                          handleRoleChange(employee.id, value);
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Role</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditDialogOpen(employee)}
                      className="h-7 w-7"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleStatus(employee.id)}
                      className="h-7 w-7"
                    >
                      <Power
                        className={`h-3.5 w-3.5 ${
                          employee.status === "active"
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteEmployee(employee.id)}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>Update employee information</DialogDescription>
            </DialogHeader>
            {editingEmployee && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="john@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">New Password (Optional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <Button
                  onClick={handleUpdateEmployee}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isUpdating}
                >
                  {isUpdating ? <><Spinner className="mr-2" /> Updating...</> : 'Update Employee'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
