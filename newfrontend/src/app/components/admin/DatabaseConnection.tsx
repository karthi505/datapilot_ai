// import { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "../ui/card";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Label } from "../ui/label";
// import { Database, Save, Edit, RefreshCw, Trash2 } from "lucide-react";

// interface DatabaseConnectionProps {
//   onTablesLoaded: (tables: string[]) => void;
// }

// interface ConnectionData {
//   id: string;
//   method: string;
//   dbType: string;
//   createdAt: string;
//   lastVerifiedAt: string;
//   isActive: boolean;
//   schemaSnapshot?: {
//     tables?: Array<{ name: string }>;
//     totalForeignKeys?: number;
//   };
//   connectionStringPreview: string;
// }

// export function DatabaseConnection({
//   onTablesLoaded,
// }: DatabaseConnectionProps) {
//   const [dbConnectionString, setDbConnectionString] = useState("");
//   const [connectionData, setConnectionData] = useState<ConnectionData | null>(
//     null,
//   );
//   const [isDbConnected, setIsDbConnected] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isEditingConnection, setIsEditingConnection] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     checkExistingConnection();
//   }, []);

//   const checkExistingConnection = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_API_URL}/api/database/connection`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//         },
//       );

//       if (response.ok) {
//         const data = await response.json();
//         if (data.success && data.data) {
//           setConnectionData(data.data);
//           setIsDbConnected(true);
//           // Extract table names from schema snapshot
//           if (data.data.schemaSnapshot?.tables) {
//             const tableNames = data.data.schemaSnapshot.tables.map(
//               (t: any) => t.name,
//             );
//             onTablesLoaded(tableNames);
//           }
//         } else {
//           setIsDbConnected(false);
//         }
//       } else if (response.status === 404) {
//         // No connection found - this is normal for first-time users
//         setIsDbConnected(false);
//       }
//     } catch (err) {
//       console.error("Error checking connection:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCreateConnection = async () => {
//     if (!dbConnectionString.trim()) {
//       setError("Connection string is required");
//       return;
//     }

//     setIsSaving(true);
//     setError("");

//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_API_URL}/api/database/connection/automatic`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//           body: JSON.stringify({
//             connectionString: dbConnectionString,
//             dbType: "POSTGRESQL",
//           }),
//         },
//       );

//       const data = await response.json();

//       if (response.ok && data.success) {
//         setDbConnectionString("");
//         setIsEditingConnection(false);

//         // Fetch updated connection details including schema
//         await checkExistingConnection();

//         alert(
//           `Database connection created successfully! ${data.data.tablesCount} tables detected.`,
//         );
//       } else {
//         setError(data.message || "Failed to create connection");
//         alert(`Error: ${data.message}`);
//       }
//     } catch (err) {
//       console.error("Error creating connection:", err);
//       setError("Server error while creating connection");
//       alert("Server error while creating connection");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleUpdateConnection = async () => {
//     if (!dbConnectionString.trim()) {
//       setError("Connection string is required");
//       return;
//     }

//     setIsSaving(true);
//     setError("");

//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_API_URL}/api/database/connection`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//           body: JSON.stringify({
//             connectionString: dbConnectionString,
//             dbType: "POSTGRESQL",
//             method: "automatic",
//           }),
//         },
//       );

//       const data = await response.json();

//       if (response.ok && data.success) {
//         setDbConnectionString("");
//         setIsEditingConnection(false);

//         // Fetch updated connection details
//         await checkExistingConnection();

//         alert(
//           `Database connection updated successfully! ${data.data.tablesCount} tables detected.`,
//         );
//       } else {
//         setError(data.message || "Failed to update connection");
//         alert(`Error: ${data.message}`);
//       }
//     } catch (err) {
//       console.error("Error updating connection:", err);
//       setError("Server error while updating connection");
//       alert("Server error while updating connection");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleDeleteConnection = async () => {
//     if (
//       !window.confirm(
//         "Are you sure you want to delete this database connection?",
//       )
//     ) {
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_API_URL}/api/database/connection`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//         },
//       );

//       const data = await response.json();

//       if (response.ok && data.success) {
//         setConnectionData(null);
//         setIsDbConnected(false);
//         setIsEditingConnection(false);
//         onTablesLoaded([]);
//         alert("Database connection deleted successfully");
//       } else {
//         alert(`Error: ${data.message}`);
//       }
//     } catch (err) {
//       console.error("Error deleting connection:", err);
//       alert("Server error while deleting connection");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     if (!dbConnectionString.trim()) {
//       setError("Connection string is required for testing");
//       return;
//     }

//     setIsSaving(true);
//     setError("");

//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_API_URL}/api/database/connection/test`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//           body: JSON.stringify({
//             connectionString: dbConnectionString,
//             dbType: "POSTGRESQL",
//           }),
//         },
//       );

//       const data = await response.json();

//       if (response.ok && data.success) {
//         alert("Database connection test successful!");
//       } else {
//         alert(`Connection test failed: ${data.message || data.error}`);
//       }
//     } catch (err) {
//       console.error("Error testing connection:", err);
//       alert("Server error while testing connection");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleEditConnection = () => {
//     setIsEditingConnection(true);
//     setDbConnectionString("");
//   };

//   const handleCancelEdit = () => {
//     setIsEditingConnection(false);
//     setDbConnectionString("");
//     setError("");
//   };

//   const handleSaveOrUpdate = () => {
//     if (isEditingConnection) {
//       handleUpdateConnection();
//     } else {
//       handleCreateConnection();
//     }
//   };

//   if (isLoading) {
//     return (
//       <Card>
//         <CardHeader className="pb-4">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
//               <Database className="h-4 w-4 text-blue-600" />
//             </div>
//             <div>
//               <CardTitle className="text-base">Database Connection</CardTitle>
//               <CardDescription className="text-xs">
//                 Loading connection status...
//               </CardDescription>
//             </div>
//           </div>
//         </CardHeader>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader className="pb-4">
//         <div className="flex items-center gap-2">
//           <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
//             <Database className="h-4 w-4 text-blue-600" />
//           </div>
//           <div>
//             <CardTitle className="text-base">Database Connection</CardTitle>
//             <CardDescription className="text-xs">
//               {isDbConnected && !isEditingConnection
//                 ? "Your database is connected"
//                 : "Configure your database connection string"}
//             </CardDescription>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {!isDbConnected || isEditingConnection ? (
//           <>
//             <div className="space-y-2">
//               <Label htmlFor="db-connection">Connection String</Label>
//               <Input
//                 id="db-connection"
//                 type="password"
//                 value={dbConnectionString}
//                 onChange={(e) => {
//                   setDbConnectionString(e.target.value);
//                   setError("");
//                 }}
//                 placeholder="e.g., postgresql://user:password@host:port/database"
//                 className="font-mono text-sm"
//               />
//               {error && <p className="text-xs text-red-600">{error}</p>}
//               <p className="text-xs text-gray-500">
//                 Enter your PostgreSQL connection string. The connection will be
//                 encrypted and schema will be automatically introspected.
//               </p>
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 onClick={handleTestConnection}
//                 disabled={!dbConnectionString || isSaving}
//                 variant="outline"
//                 className="flex-1"
//               >
//                 {isSaving ? "Testing..." : "Test Connection"}
//               </Button>
//               <Button
//                 onClick={handleSaveOrUpdate}
//                 disabled={!dbConnectionString || isSaving}
//                 className="flex-1 bg-blue-600 hover:bg-blue-700"
//               >
//                 <Save className="h-4 w-4 mr-2" />
//                 {isSaving
//                   ? "Saving..."
//                   : isEditingConnection
//                     ? "Update Connection"
//                     : "Save Connection"}
//               </Button>
//               {isEditingConnection && (
//                 <Button onClick={handleCancelEdit} variant="ghost">
//                   Cancel
//                 </Button>
//               )}
//             </div>
//           </>
//         ) : (
//           <>
//             <div className="space-y-2">
//               <Label>Connection Status</Label>
//               <div className="flex items-center gap-2 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
//                 <Database className="h-4 w-4 text-green-600" />
//                 <span className="text-green-700">
//                   Database connected successfully
//                 </span>
//               </div>

//               {/* Connection Details */}
//               <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
//                 <div className="flex justify-between text-xs">
//                   <span className="text-gray-600">Database Type:</span>
//                   <span className="font-medium text-gray-900">
//                     {connectionData?.dbType}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-xs">
//                   <span className="text-gray-600">Method:</span>
//                   <span className="font-medium text-gray-900 capitalize">
//                     {connectionData?.method}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-xs">
//                   <span className="text-gray-600">Tables Detected:</span>
//                   <span className="font-medium text-gray-900">
//                     {connectionData?.schemaSnapshot?.tables?.length || 0}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-xs">
//                   <span className="text-gray-600">Foreign Keys:</span>
//                   <span className="font-medium text-gray-900">
//                     {connectionData?.schemaSnapshot?.totalForeignKeys || 0}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-xs">
//                   <span className="text-gray-600">Last Verified:</span>
//                   <span className="font-medium text-gray-900">
//                     {connectionData?.lastVerifiedAt
//                       ? new Date(connectionData.lastVerifiedAt).toLocaleString()
//                       : "N/A"}
//                   </span>
//                 </div>
//               </div>

//               <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
//                 <span className="font-mono text-xs">
//                   {connectionData?.connectionStringPreview}
//                 </span>
//               </div>
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 onClick={handleEditConnection}
//                 className="flex-1 bg-blue-600 hover:bg-blue-700"
//               >
//                 <Edit className="h-4 w-4 mr-2" />
//                 Update Connection String
//               </Button>
//               <Button
//                 onClick={handleDeleteConnection}
//                 disabled={isSaving}
//                 variant="destructive"
//                 className="flex-1"
//               >
//                 <Trash2 className="h-4 w-4 mr-2" />
//                 Delete
//               </Button>
//             </div>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

import { useState, useEffect } from "react";
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
import { Database, Save, Edit, Trash2, Table } from "lucide-react";
import { Spinner } from "../ui/spinner";

interface DatabaseConnectionProps {
  onTablesLoaded: (tables: string[]) => void;
  onViewDatabase?: () => void; // NEW
  tablesCount?: number; // NEW
}

interface ConnectionData {
  id: string;
  method: string;
  dbType: string;
  createdAt: string;
  lastVerifiedAt: string;
  isActive: boolean;
  schemaSnapshot?: {
    tables?: Array<{ name: string }>;
    totalForeignKeys?: number;
  };
  connectionStringPreview: string;
}

export function DatabaseConnection({
  onTablesLoaded,
  onViewDatabase, // NEW
  tablesCount, // NEW
}: DatabaseConnectionProps) {
  const [dbConnectionString, setDbConnectionString] = useState("");
  const [connectionData, setConnectionData] = useState<ConnectionData | null>(
    null,
  );
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingConnection, setIsEditingConnection] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/database/connection`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setConnectionData(data.data);
          setIsDbConnected(true);
          if (data.data.schemaSnapshot?.tables) {
            const tableNames = data.data.schemaSnapshot.tables.map(
              (t: any) => t.name,
            );
            onTablesLoaded(tableNames);
          }
        } else {
          setIsDbConnected(false);
        }
      } else if (response.status === 404) {
        setIsDbConnected(false);
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConnection = async () => {
    if (!dbConnectionString.trim()) {
      setError("Connection string is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/database/connection/automatic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            connectionString: dbConnectionString,
            dbType: "POSTGRESQL",
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setDbConnectionString("");
        setIsEditingConnection(false);
        await checkExistingConnection();
        alert(
          `Database connection created successfully! ${data.data.tablesCount} tables detected.`,
        );
      } else {
        setError(data.message || "Failed to create connection");
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error("Error creating connection:", err);
      setError("Server error while creating connection");
      alert("Server error while creating connection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConnection = async () => {
    if (!dbConnectionString.trim()) {
      setError("Connection string is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/database/connection`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            connectionString: dbConnectionString,
            dbType: "POSTGRESQL",
            method: "automatic",
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setDbConnectionString("");
        setIsEditingConnection(false);
        await checkExistingConnection();
        alert(
          `Database connection updated successfully! ${data.data.tablesCount} tables detected.`,
        );
      } else {
        setError(data.message || "Failed to update connection");
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error("Error updating connection:", err);
      setError("Server error while updating connection");
      alert("Server error while updating connection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConnection = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this database connection?",
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/database/connection`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionData(null);
        setIsDbConnected(false);
        setIsEditingConnection(false);
        onTablesLoaded([]);
        alert("Database connection deleted successfully");
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error("Error deleting connection:", err);
      alert("Server error while deleting connection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!dbConnectionString.trim()) {
      setError("Connection string is required for testing");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/database/connection/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            connectionString: dbConnectionString,
            dbType: "POSTGRESQL",
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Database connection test successful!");
      } else {
        alert(`Connection test failed: ${data.message || data.error}`);
      }
    } catch (err) {
      console.error("Error testing connection:", err);
      alert("Server error while testing connection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditConnection = () => {
    setIsEditingConnection(true);
    setDbConnectionString("");
  };

  const handleCancelEdit = () => {
    setIsEditingConnection(false);
    setDbConnectionString("");
    setError("");
  };

  const handleSaveOrUpdate = () => {
    if (isEditingConnection) {
      handleUpdateConnection();
    } else {
      handleCreateConnection();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Database className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Database Connection</CardTitle>
              <CardDescription className="text-xs">
                Loading connection status...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Database className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">Database Connection</CardTitle>
            <CardDescription className="text-xs">
              {isDbConnected && !isEditingConnection
                ? "Your database is connected"
                : "Configure your database connection string"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isDbConnected || isEditingConnection ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="db-connection">Connection String</Label>
              <Input
                id="db-connection"
                type="password"
                value={dbConnectionString}
                onChange={(e) => {
                  setDbConnectionString(e.target.value);
                  setError("");
                }}
                placeholder="e.g., postgresql://user:password@host:port/database"
                className="font-mono text-sm"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <p className="text-xs text-gray-500">
                Enter your PostgreSQL connection string. The connection will be
                encrypted and schema will be automatically introspected.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={!dbConnectionString || isSaving}
                variant="outline"
                className="flex-1"
              >
                {isSaving ? <><Spinner className="mr-2" /> Testing...</> : "Test Connection"}
              </Button>
              <Button
                onClick={handleSaveOrUpdate}
                disabled={!dbConnectionString || isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? <><Spinner className="mr-2" /> Saving...</> : <>
                <Save className="h-4 w-4 mr-2" />
                {isEditingConnection
                    ? "Update Connection"
                    : "Save Connection"}</>}
              </Button>
              {isEditingConnection && (
                <Button onClick={handleCancelEdit} variant="ghost">
                  Cancel
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Connection Status</Label>
              <div className="flex items-center gap-2 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                <Database className="h-4 w-4 text-green-600" />
                <span className="text-green-700">
                  Database connected successfully
                </span>
              </div>

              {/* Connection Details */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Database Type:</span>
                  <span className="font-medium text-gray-900">
                    {connectionData?.dbType}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {connectionData?.method}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Tables Detected:</span>
                  <span className="font-medium text-gray-900">
                    {connectionData?.schemaSnapshot?.tables?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Foreign Keys:</span>
                  <span className="font-medium text-gray-900">
                    {connectionData?.schemaSnapshot?.totalForeignKeys || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Last Verified:</span>
                  <span className="font-medium text-gray-900">
                    {connectionData?.lastVerifiedAt
                      ? new Date(connectionData.lastVerifiedAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <span className="font-mono text-xs">
                  {connectionData?.connectionStringPreview}
                </span>
              </div>
            </div>

            {/* Update + Delete buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleEditConnection}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Connection String
              </Button>
              <Button
                onClick={handleDeleteConnection}
                disabled={isSaving}
                variant="destructive"
                className="flex-1"
              >
                {isSaving ? <Spinner className="mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </div>

            {/* NEW: View Database button — only shown when tables are loaded */}
            {onViewDatabase && tablesCount && tablesCount > 0 && (
              <Button
                onClick={onViewDatabase}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Table className="h-4 w-4 mr-2" />
                View Database
                <span className="ml-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {tablesCount} tables
                </span>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
