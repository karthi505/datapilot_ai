// utils/databaseHelper.js
import pg from "pg";
// import mysql from "mysql2/promise";

const { Pool } = pg;

// Store active connections
const connectionPools = new Map();

// Test database connection
export const testDatabaseConnection = async (connectionString, dbType) => {
  try {
    let client;
    let pool;

    switch (dbType.toUpperCase()) {
      case "POSTGRESQL":
        pool = new Pool({
          connectionString,
          max: 1,
          connectionTimeoutMillis: 5000,
        });
        client = await pool.connect();

        // Test query
        const pgResult = await client.query("SELECT NOW()");

        // Get database info
        const dbInfo = await client.query(`
          SELECT 
            current_database() as database_name,
            version() as version
        `);

        // console.log(pgResult, dbInfo);

        client.release();
        await pool.end();

        return {
          success: true,
          info: {
            database: dbInfo.rows[0].database_name,
            version:
              dbInfo.rows[0].version.split(" ")[0] +
              " " +
              dbInfo.rows[0].version.split(" ")[1],
          },
        };

      //   case 'MYSQL':
      //     const connection = await mysql.createConnection(connectionString);

      //     // Test query
      //     await connection.query('SELECT NOW()');

      //     // Get database info
      //     const [rows] = await connection.query('SELECT DATABASE() as database_name, VERSION() as version');

      //     await connection.end();

      //     return {
      //       success: true,
      //       info: {
      //         database: rows[0].database_name,
      //         version: 'MySQL ' + rows[0].version
      //       }
      //     };

      //   default:
      //     return {
      //       success: false,
      //       error: `Unsupported database type: ${dbType}`
      //     };
    }
  } catch (error) {
    console.error("Database Connection Test Error:", error);
    return {
      success: false,
      error: error.message || "Failed to connect to database",
    };
  }
};

// Close specific database connection
export const closeDatabaseConnection = async (connectionString, dbType) => {
  const poolKey = `${dbType}_${connectionString}`;

  if (connectionPools.has(poolKey)) {
    const pool = connectionPools.get(poolKey);

    try {
      if (dbType.toUpperCase() === "POSTGRESQL") {
        await pool.end();
      } else if (dbType.toUpperCase() === "MYSQL") {
        await pool.end();
      }
    } catch (error) {
      console.error("Error closing connection pool:", error);
    }

    connectionPools.delete(poolKey);
  }
};

// Execute query on client database
export const executeQuery = async (
  connectionString,
  dbType,
  query,
  params = []
) => {
  try {
    const pool = await getDatabaseConnection(connectionString, dbType);
    let result;

    switch (dbType.toUpperCase()) {
      case "POSTGRESQL":
        const client = await pool.connect();
        result = await client.query(query, params);
        client.release();
        return {
          success: true,
          rows: result.rows,
          rowCount: result.rowCount,
        };

      //   case "MYSQL":
      //     const [rows] = await pool.query(query, params);
      //     return {
      //       success: true,
      //       rows: rows,
      //       rowCount: Array.isArray(rows) ? rows.length : 0,
      //     };

      default:
        return {
          success: false,
          error: `Unsupported database type: ${dbType}`,
        };
    }
  } catch (error) {
    console.error("Query Execution Error:", error);
    return {
      success: false,
      error: error.message || "Failed to execute query",
    };
  }
};

// Helper function to mask connection string
export function maskConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    const password = url.password;
    if (password) {
      const maskedPassword =
        password.length > 4
          ? "*".repeat(password.length - 4) + password.slice(-4)
          : "****";
      url.password = maskedPassword;
    }
    return url.toString();
  } catch (error) {
    if (connectionString.length > 20) {
      return (
        connectionString.slice(0, 10) + "..." + connectionString.slice(-10)
      );
    }
    return "****";
  }
}

export const introspectSchemaDetailed = async (connectionString, dbType) => {
  try {
    let client;
    let pool;
    let schema = {
      tables: [],
      totalTables: 0,
      totalForeignKeys: 0,
      introspectedAt: new Date().toISOString(),
    };

    switch (dbType.toUpperCase()) {
      case "POSTGRESQL":
        pool = new Pool({
          connectionString,
          max: 1,
          connectionTimeoutMillis: 10000,
        });
        client = await pool.connect();

        // Get all tables with columns
        const tablesQuery = `
          SELECT 
            t.table_name,
            obj_description(pgc.oid) as table_comment,
            json_agg(
              json_build_object(
                'name', c.column_name,
                'type', c.data_type,
                'nullable', c.is_nullable = 'YES',
                'default', c.column_default,
                'max_length', c.character_maximum_length
              ) ORDER BY c.ordinal_position
            ) as columns
          FROM information_schema.tables t
          LEFT JOIN pg_class pgc ON pgc.relname = t.table_name
          LEFT JOIN information_schema.columns c 
            ON t.table_name = c.table_name 
            AND t.table_schema = c.table_schema
          WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
          GROUP BY t.table_name, pgc.oid
          ORDER BY t.table_name;
        `;

        const tablesResult = await client.query(tablesQuery);

        // Get primary keys
        const pkQuery = `
          SELECT 
            tc.table_name,
            array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as primary_keys
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = 'public'
          GROUP BY tc.table_name;
        `;

        const pkResult = await client.query(pkQuery);
        const primaryKeys = {};
        pkResult.rows.forEach((row) => {
          primaryKeys[row.table_name] = row.primary_keys;
        });

        // Get foreign keys
        const fkQuery = `
          SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule,
            rc.update_rule
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
            AND tc.table_schema = rc.constraint_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public';
        `;

        const fkResult = await client.query(fkQuery);
        const foreignKeys = {};
        fkResult.rows.forEach((row) => {
          if (!foreignKeys[row.table_name]) {
            foreignKeys[row.table_name] = [];
          }
          foreignKeys[row.table_name].push({
            column: row.column_name,
            referencesTable: row.foreign_table_name,
            referencesColumn: row.foreign_column_name,
            onDelete: row.delete_rule,
            onUpdate: row.update_rule,
          });
        });

        schema.totalForeignKeys = fkResult.rows.length;

        // Build final schema
        schema.tables = tablesResult.rows.map((row) => ({
          name: row.table_name,
          description: row.table_comment || null,
          columns: row.columns,
          primaryKeys: primaryKeys[row.table_name] || [],
          foreignKeys: foreignKeys[row.table_name] || [],
        }));
        schema.totalTables = tablesResult.rows.length;

        client.release();
        await pool.end();
        break;

      case "MYSQL":
        const connection = await mysql.createConnection(connectionString);

        // Get database name
        const [dbRows] = await connection.query("SELECT DATABASE() as db_name");
        const dbName = dbRows[0].db_name;

        // Get all tables with comments
        const [tables] = await connection.query(
          `SELECT table_name, table_comment 
           FROM information_schema.tables 
           WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
          [dbName]
        );

        let totalFks = 0;

        // Get details for each table
        for (const table of tables) {
          // Get columns
          const [columns] = await connection.query(
            `SELECT 
              column_name as name,
              data_type as type,
              is_nullable = 'YES' as nullable,
              column_default as \`default\`,
              character_maximum_length as max_length,
              column_comment as description
            FROM information_schema.columns 
            WHERE table_schema = ? AND table_name = ?
            ORDER BY ordinal_position`,
            [dbName, table.table_name]
          );

          // Get primary keys
          const [pks] = await connection.query(
            `SELECT column_name
             FROM information_schema.key_column_usage
             WHERE table_schema = ? 
               AND table_name = ? 
               AND constraint_name = 'PRIMARY'
             ORDER BY ordinal_position`,
            [dbName, table.table_name]
          );

          // Get foreign keys
          const [fks] = await connection.query(
            `SELECT 
              column_name as \`column\`,
              referenced_table_name as referencesTable,
              referenced_column_name as referencesColumn
             FROM information_schema.key_column_usage
             WHERE table_schema = ? 
               AND table_name = ?
               AND referenced_table_name IS NOT NULL`,
            [dbName, table.table_name]
          );

          totalFks += fks.length;

          schema.tables.push({
            name: table.table_name,
            description: table.table_comment || null,
            columns: columns,
            primaryKeys: pks.map((pk) => pk.column_name),
            foreignKeys: fks,
          });
        }

        schema.totalTables = tables.length;
        schema.totalForeignKeys = totalFks;
        await connection.end();
        break;

      default:
        return {
          success: false,
          error: `Unsupported database type: ${dbType}`,
        };
    }

    return {
      success: true,
      schema,
    };
  } catch (error) {
    console.error("Detailed Schema Introspection Error:", error);
    return {
      success: false,
      error: error.message || "Failed to introspect schema",
    };
  }
};

// Get or create database connection pool
export const getDatabaseConnection = async (connectionString, dbType) => {
  const poolKey = `${dbType}_${connectionString}`;

  if (connectionPools.has(poolKey)) {
    return connectionPools.get(poolKey);
  }

  let pool;

  switch (dbType.toUpperCase()) {
    case "POSTGRESQL":
      pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      break;

    case "MYSQL":
      pool = mysql.createPool({
        uri: connectionString,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      break;

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }

  connectionPools.set(poolKey, pool);
  return pool;
};
