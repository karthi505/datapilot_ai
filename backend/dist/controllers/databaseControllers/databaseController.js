import { prisma } from "../../lib/prisma.js";
import {
  closeDatabaseConnection,
  introspectSchemaDetailed,
  maskConnectionString,
  testDatabaseConnection,
} from "../../utils/databaseHelper.js";
import {
  decryptConnectionString,
  encryptConnectionString,
} from "../../utils/encryption.js";
// import { scanAndProcessSchema } from "../../services/scanService.js";
const { scanAndProcessSchema } = await import("../../services/scanService.js");
import pkg from "pg";
const { Client } = pkg;

// Create database connection with MANUAL schema input
export const createConnectionManual = async (req, res) => {
  try {
    const {
      connectionString,
      dbType = "POSTGRESQL",
      schemaDefinition,
    } = req.body;
    const companyId = req.user.companyId;

    // Validation
    if (!connectionString) {
      return res.status(400).json({
        success: false,
        message: "Connection string is required",
      });
    }

    if (
      !schemaDefinition ||
      !schemaDefinition.tables ||
      !Array.isArray(schemaDefinition.tables)
    ) {
      return res.status(400).json({
        success: false,
        message: "Schema definition is required and must include tables array",
      });
    }

    // Validate schema structure - FUNCTION NOT DEFINED
    // const validationError = validateManualSchema(schemaDefinition);
    // if (validationError) {
    //   return res.status(400).json({
    //     success: false,
    //     message: validationError,
    //   });
    // }

    // Check if connection already exists for this company (ONE per company rule)
    const existingConnection = await prisma.databaseConnection.findFirst({
      where: { companyId },
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message:
          "A database connection already exists for your company. Please delete it first or use update.",
      });
    }

    // Test connection first
    const testResult = await testDatabaseConnection(connectionString, dbType);
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: "Connection test failed",
        error: testResult.error,
      });
    }

    // Encrypt connection string
    const encryptedConnectionString = encryptConnectionString(connectionString);

    // Create database connection record with manual schema
    const dbConnection = await prisma.databaseConnection.create({
      data: {
        companyId,
        dbType,
        connectionString: encryptedConnectionString,
        // connectionString,
        schemaSnapshot: {
          method: "manual",
          ...schemaDefinition,
          createdAt: new Date().toISOString(),
        },
        lastVerifiedAt: new Date(),
      },
    });

    // Close test connection
    await closeDatabaseConnection(connectionString, dbType);

    res.status(201).json({
      success: true,
      message:
        "Database connection created successfully with manual schema definition",
      data: {
        id: dbConnection.id,
        method: "manual",
        dbType: dbConnection.dbType,
        createdAt: dbConnection.createdAt,
        lastVerifiedAt: dbConnection.lastVerifiedAt,
        isActive: dbConnection.isActive,
        tablesCount: schemaDefinition.tables?.length || 0,
        connectionStatus: "Connected",
      },
    });
  } catch (error) {
    console.error("Create Connection Manual Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating database connection",
    });
  }
};

// Create database connection with AUTOMATIC schema introspection
export const createConnectionAutomatic = async (req, res) => {
  try {
    const { connectionString, dbType = "POSTGRESQL" } = req.body;
    const companyId = req.user.companyId;

    // Validation
    if (!connectionString) {
      return res.status(400).json({
        success: false,
        message: "Connection string is required",
      });
    }

    // Check if connection already exists for this company (ONE per company rule)
    const existingConnection = await prisma.databaseConnection.findFirst({
      where: { companyId },
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message:
          "A database connection already exists for your company. Please delete it first or use update.",
      });
    }

    // Test connection first
    const testResult = await testDatabaseConnection(connectionString, dbType);
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: "Connection test failed",
        error: testResult.error,
      });
    }

    // Automatically introspect schema with enhanced details (FK, PK, etc.)
    const schemaResult = await introspectSchemaDetailed(
      connectionString,
      dbType,
    );

    if (!schemaResult.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to introspect database schema",
        error: schemaResult.error,
      });
    }

    console.log(schemaResult);

    // Encrypt connection string
    const encryptedConnectionString = encryptConnectionString(connectionString);

    // Create database connection record
    const dbConnection = await prisma.databaseConnection.create({
      data: {
        companyId,
        dbType,
        connectionString: encryptedConnectionString,
        schemaSnapshot: {
          method: "automatic",
          ...schemaResult.schema,
        },
        lastVerifiedAt: new Date(),
      },
    });

    // Close test connection
    await closeDatabaseConnection(connectionString, dbType);

    res.status(201).json({
      success: true,
      message:
        "Database connection created successfully with automatic schema introspection",
      data: {
        id: dbConnection.id,
        method: "automatic",
        dbType: dbConnection.dbType,
        createdAt: dbConnection.createdAt,
        lastVerifiedAt: dbConnection.lastVerifiedAt,
        isActive: dbConnection.isActive,
        tablesCount: schemaResult.schema.tables?.length || 0,
        foreignKeysDetected: schemaResult.schema.totalForeignKeys || 0,
        connectionStatus: "Connected",
      },
    });

    scanAndProcessSchema(companyId).catch((err) =>
      console.error("Auto-scan error:", err.message),
    );
  } catch (error) {
    console.error("Create Connection Automatic Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating database connection",
    });
  }
};

// Get connection for company (only ONE connection per company)
export const getConnection = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const connection = await prisma.databaseConnection.findFirst({
      where: { companyId },
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "No database connection found for your company",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: connection.id,
        method: connection.schemaSnapshot?.method || "unknown",
        dbType: connection.dbType,
        createdAt: connection.createdAt,
        lastVerifiedAt: connection.lastVerifiedAt,
        isActive: connection.isActive,
        schemaSnapshot: connection.schemaSnapshot,
        connectionStringPreview: maskConnectionString(
          decryptConnectionString(connection.connectionString),
        ),
      },
    });
  } catch (error) {
    console.error("Get Connection Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching connection",
    });
  }
};

// Update connection - can switch between automatic and manual
export const updateConnection = async (req, res) => {
  try {
    const { connectionString, dbType, method, schemaDefinition } = req.body;
    const companyId = req.user.companyId;

    // Find existing connection
    const existingConnection = await prisma.databaseConnection.findFirst({
      where: { companyId },
    });

    if (!existingConnection) {
      return res.status(404).json({
        success: false,
        message: "No database connection found for your company",
      });
    }

    // Prepare update data
    let updateData = {};
    let schemaSnapshot = null;

    // If connection string or dbType is being updated
    if (connectionString || dbType) {
      const newConnectionString =
        connectionString ||
        decryptConnectionString(existingConnection.connectionString);
      const newDbType = dbType || existingConnection.dbType;

      // Test new connection
      const testResult = await testDatabaseConnection(
        newConnectionString,
        newDbType,
      );
      if (!testResult.success) {
        return res.status(400).json({
          success: false,
          message: "Connection test failed",
          error: testResult.error,
        });
      }

      if (connectionString) {
        updateData.connectionString = encryptConnectionString(connectionString);
      }
      if (dbType) {
        updateData.dbType = dbType;
      }

      // Close test connection
      await closeDatabaseConnection(newConnectionString, newDbType);
    }

    // Handle schema update based on method
    if (method === "automatic") {
      const connString =
        connectionString ||
        decryptConnectionString(existingConnection.connectionString);
      const connDbType = dbType || existingConnection.dbType;

      const schemaResult = await introspectSchemaDetailed(
        connString,
        connDbType,
      );
      if (!schemaResult.success) {
        return res.status(400).json({
          success: false,
          message: "Failed to introspect database schema",
          error: schemaResult.error,
        });
      }

      schemaSnapshot = {
        method: "automatic",
        ...schemaResult.schema,
      };

      await closeDatabaseConnection(connString, connDbType);
    } else if (method === "manual") {
      if (!schemaDefinition) {
        return res.status(400).json({
          success: false,
          message: "Schema definition is required for manual method",
        });
      }

      const validationError = validateManualSchema(schemaDefinition);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      schemaSnapshot = {
        method: "manual",
        ...schemaDefinition,
        updatedAt: new Date().toISOString(),
      };
    }

    if (schemaSnapshot) {
      updateData.schemaSnapshot = schemaSnapshot;
    }

    updateData.lastVerifiedAt = new Date();

    // Update connection
    const updatedConnection = await prisma.databaseConnection.update({
      where: { id: existingConnection.id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Database connection updated successfully",
      data: {
        id: updatedConnection.id,
        method: updatedConnection.schemaSnapshot?.method || "unknown",
        dbType: updatedConnection.dbType,
        lastVerifiedAt: updatedConnection.lastVerifiedAt,
        tablesCount: updatedConnection.schemaSnapshot?.tables?.length || 0,
      },
    });
  } catch (error) {
    console.error("Update Connection Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating connection",
    });
  }
};

// Delete connection
export const deleteConnection = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Find connection
    const connection = await prisma.databaseConnection.findFirst({
      where: { companyId },
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "No database connection found for your company",
      });
    }

    // Delete connection
    await prisma.databaseConnection.delete({
      where: { id: connection.id },
    });

    res.status(200).json({
      success: true,
      message: "Database connection deleted successfully",
    });
  } catch (error) {
    console.error("Delete Connection Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting connection",
    });
  }
};

// Test connection without saving
export const testConnection = async (req, res) => {
  try {
    const { connectionString, dbType = "POSTGRESQL" } = req.body;

    if (!connectionString) {
      return res.status(400).json({
        success: false,
        message: "Connection string is required",
      });
    }

    // Test connection
    const testResult = await testDatabaseConnection(connectionString, dbType);

    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: "Connection test failed",
        error: testResult.error,
      });
    }

    // Close connection
    await closeDatabaseConnection(connectionString, dbType);

    res.status(200).json({
      success: true,
      message: "Connection test successful",
      data: {
        status: "Connected",
        databaseInfo: testResult.info,
      },
    });
  } catch (error) {
    console.error("Test Connection Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while testing connection",
    });
  }
};

export const getTableData = async (req, res) => {
  try {
    const { tableName } = req.params;
    const companyId = req.user.companyId;

    // 1. Validate table name — only allow alphanumeric + underscore to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table name",
      });
    }

    // 2. Get the company's saved connection from your own DB
    const connection = await prisma.databaseConnection.findFirst({
      where: { companyId },
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "No database connection found for your company",
      });
    }

    // 3. Verify the requested table actually exists in the saved schema snapshot
    //    (prevents querying tables the company doesn't own)
    const allowedTables =
      connection.schemaSnapshot?.tables?.map((t) => t.name) || [];

    if (!allowedTables.includes(tableName)) {
      return res.status(403).json({
        success: false,
        message: "Table not found in your database schema",
      });
    }

    // 4. Decrypt the connection string and connect to the user's database
    const decryptedConnectionString = decryptConnectionString(
      connection.connectionString,
    );

    const client = new Client({ connectionString: decryptedConnectionString });
    await client.connect();

    try {
      // 5. Query the table — LIMIT 500 to avoid huge payloads
      const result = await client.query(
        `SELECT * FROM "${tableName}" LIMIT 500`,
      );

      const columns = result.fields.map((f) => f.name);
      const rows = result.rows;

      res.status(200).json({
        success: true,
        data: {
          tableName,
          columns,
          rows,
          totalRows: rows.length,
        },
      });
    } finally {
      // Always close the client connection
      await client.end();
    }
  } catch (error) {
    console.error("Get Table Data Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching table data",
    });
  }
};
