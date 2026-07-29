# Project Structure

This document outlines the organization of the codebase for better maintainability and scalability.

## Directory Structure

```
src/app/
├── components/
│   ├── admin/                 # Admin-specific components
│   │   ├── DatabaseConnection.tsx
│   │   ├── EmployeeManagement.tsx
│   │   ├── RoleManagement.tsx
│   │   └── StatsCards.tsx
│   ├── user/                  # User-specific components
│   │   ├── AccessDenied.tsx
│   │   ├── NaturalLanguageQuery.tsx
│   │   ├── QueryHistory.tsx
│   │   ├── QueryOutput.tsx
│   │   └── VisualizationRenderer.tsx
│   ├── shared/                # Shared components
│   │   └── Header.tsx
│   ├── ui/                    # UI library components (shadcn/ui)
│   └── [Auth components]      # AuthPage, AdminRegistration, UserRegistration, OTPVerification
├── pages/                     # Main page components
│   ├── AdminDashboard.tsx
│   └── UserDashboard.tsx
├── services/                  # Business logic and data services
│   ├── authService.ts         # Authentication logic
│   ├── databaseService.ts     # Database connection management
│   ├── employeeService.ts     # Employee CRUD operations
│   ├── queryService.ts        # Query processing and mock responses
│   └── roleService.ts         # Role management
├── types/                     # TypeScript type definitions
│   └── index.ts               # All shared types
└── App.tsx                    # Main application component
```

## Layer Responsibilities

### 1. Services Layer (`/services`)
- **Purpose**: Business logic, data persistence, and API interactions
- **Responsibilities**:
  - localStorage operations
  - Data validation
  - Mock API calls
  - Business rules enforcement
- **Examples**:
  - `authService`: User authentication, session management
  - `employeeService`: Employee CRUD operations
  - `roleService`: Role and permissions management
  - `databaseService`: Database connection handling
  - `queryService`: Query execution and response generation

### 2. Components Layer (`/components`)
- **Purpose**: Reusable UI components
- **Organization**:
  - `admin/`: Admin dashboard specific components
  - `user/`: User dashboard specific components
  - `shared/`: Components used across multiple pages
  - `ui/`: Base UI library components (shadcn/ui)
- **Responsibilities**:
  - UI rendering
  - User interactions
  - Event handling
  - Prop validation

### 3. Pages Layer (`/pages`)
- **Purpose**: Top-level page components that compose smaller components
- **Responsibilities**:
  - State management for the page
  - Coordinating between services and components
  - Handling page-level logic
  - Composing multiple components together

### 4. Types Layer (`/types`)
- **Purpose**: Centralized TypeScript type definitions
- **Responsibilities**:
  - Interface definitions
  - Type aliases
  - Shared types across the application

## Data Flow

```
User Interaction
      ↓
  Component
      ↓
  Page Component (state management)
      ↓
  Service (business logic)
      ↓
  localStorage / Mock API
      ↓
  Service (data transformation)
      ↓
  Page Component (update state)
      ↓
  Component (re-render)
```

## Key Design Principles

1. **Separation of Concerns**: UI logic separated from business logic
2. **Single Responsibility**: Each file has one clear purpose
3. **Reusability**: Components and services can be reused across the app
4. **Maintainability**: Easy to locate and update specific functionality
5. **Testability**: Services and components can be tested independently

## Adding New Features

### To add a new admin feature:
1. Create service functions in appropriate service file
2. Create component in `/components/admin/`
3. Import and use in `/pages/AdminDashboard.tsx`

### To add a new user feature:
1. Create service functions in appropriate service file
2. Create component in `/components/user/`
3. Import and use in `/pages/UserDashboard.tsx`

### To add shared functionality:
1. Create service in `/services/`
2. Create shared component in `/components/shared/`
3. Define types in `/types/index.ts`
4. Use in multiple pages as needed

## Benefits of This Structure

- ✅ **Scalability**: Easy to add new features without affecting existing code
- ✅ **Maintainability**: Clear organization makes finding code simple
- ✅ **Reusability**: Components and services are modular
- ✅ **Testing**: Each layer can be tested independently
- ✅ **Collaboration**: Multiple developers can work on different parts
- ✅ **Code Quality**: Enforces best practices and clean architecture
