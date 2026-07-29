// User and Authentication Types
export interface User {
  name: string;
  email: string;
  password: string;
  companyName: string;
  userType?: string;
  role: string;
  roles?: Array<{ id: string; name: string }>;
  verified: boolean;
  userId?: string;
  companyId?: string;
  isActive: boolean;
}

export interface Company {
  id: string;
  name: string;
}

export interface PendingUser extends User {
  otp?: string;
}

// Employee Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string | null;
  status: "active" | "inactive";
  userType: string;
  createdAt: string;
}

// Role Types
export interface Role {
  id: string;
  roleName: string;
  description: string;
}

// Query Types
export interface Message {
  type: "success" | "error";
  content: string;
  timestamp: Date;
  generatedSql?: string;
  results?: any[];
  rowCount?: number;
  queryRequestId?: string;
  generatedQueryId?: string;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  generatedSql: string;
  rowCount?: number;
}

// Page Props Types
export type Page =
  | "auth"
  | "admin-register"
  | "user-register"
  | "otp"
  | "dashboard"
  | "forgot-password" //new
  | "reset-password"; //new
