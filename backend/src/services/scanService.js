import pg from "pg";
import { callLLM } from "./llm/llmClient.js";
import { prisma } from "../lib/prisma.js";
import { decryptConnectionString } from "../utils/encryption.js";

const { Pool } = pg;

// ── Sampling helpers ─────────────────────────────────────────────────

const getTableRowCount = async (client, tableName) => {
  try {
    const res = await client.query(
      `SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = $1`,
      [tableName]
    );
    return parseInt(res.rows[0]?.estimate || 0);
  } catch {
    return 0;
  }
};

const getSampleRows = async (client, tableName, limit = 5) => {
  try {
    const res = await client.query(`SELECT * FROM "${tableName}" LIMIT $1`, [limit]);
    return res.rows;
  } catch {
    return [];
  }
};

const getColumnStats = async (client, tableName, columns) => {
  const stats = {};

  for (const col of columns) {
    const name = col.name;
    const type = (col.type || "").toLowerCase();

    try {
      if (["text", "varchar", "char", "character varying"].some(t => type.includes(t))) {
        const cardRes = await client.query(
          `SELECT COUNT(DISTINCT "${name}") as cnt FROM "${tableName}"`
        );
        const distinctCount = parseInt(cardRes.rows[0].cnt);

        if (distinctCount <= 25) {
          const valRes = await client.query(
            `SELECT DISTINCT "${name}" FROM "${tableName}" WHERE "${name}" IS NOT NULL LIMIT 25`
          );
          stats[name] = {
            kind: "enum",
            distinctValues: valRes.rows.map(r => r[name]),
          };
        } else {
          stats[name] = { kind: "high_cardinality_text", distinctCount };
        }

      } else if (["int", "numeric", "float", "decimal", "double", "real", "bigint", "smallint"].some(t => type.includes(t))) {
        const res = await client.query(
          `SELECT MIN("${name}") as min, MAX("${name}") as max,
                  ROUND(AVG("${name}")::numeric, 2) as avg
           FROM "${tableName}"`
        );
        stats[name] = { kind: "numeric", ...res.rows[0] };

      } else if (["date", "timestamp", "time"].some(t => type.includes(t))) {
        const res = await client.query(
          `SELECT MIN("${name}") as min, MAX("${name}") as max FROM "${tableName}"`
        );
        stats[name] = { kind: "date_range", min: res.rows[0]?.min, max: res.rows[0]?.max };

      } else {
        stats[name] = { kind: "other" };
      }
    } catch {
      stats[name] = { kind: "unknown" };
    }
  }

  return stats;
};

// ── LLM description generator ────────────────────────────────────────

const generateTableDescription = async (tableSummary) => {
  const prompt = `You are a database documentation assistant.
Analyze this database table and generate concise, helpful descriptions.

Table name: ${tableSummary.tableName}
Estimated row count: ${tableSummary.rowCount}
Sample rows (first 5): ${JSON.stringify(tableSummary.sampleRows, null, 2)}
Column statistics: ${JSON.stringify(tableSummary.columnStats, null, 2)}
Column definitions: ${JSON.stringify(tableSummary.columns, null, 2)}

Respond ONLY with a valid JSON object. No markdown, no explanation, no extra text.
{
  "tableDescription": "one sentence describing what this table stores and its business purpose",
  "columns": {
    "column_name": "short description of what this column contains or represents",
    ...one entry for every column...
  }
}`.trim();

  try {
    const raw = await callLLM(prompt);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`LLM description parse error for ${tableSummary.tableName}:`, err.message);
    return { tableDescription: null, columns: {} };
  }
};

// ── Main scan function ────────────────────────────────────────────────

export const scanAndProcessSchema = async (companyId) => {

  // console.log("prisma instance:", prisma); 
  // Mark as scanning immediately
  await prisma.processedSchema.upsert({
    where: { companyId },
    create: {
      companyId,
      tables: [],
      scanStatus: "SCANNING",
    },
    update: {
      scanStatus: "SCANNING",
      scanError: null,
    },
  });

  let pool;

  try {
    const dbConnection = await prisma.databaseConnection.findFirst({
      where: { companyId, isActive: true },
    });

    if (!dbConnection) throw new Error("No active database connection found");

    const connectionString = decryptConnectionString(dbConnection.connectionString);
    const rawTables = dbConnection.schemaSnapshot?.tables || [];

    if (rawTables.length === 0) throw new Error("No tables found in schema snapshot");

    pool = new Pool({ connectionString, max: 3, connectionTimeoutMillis: 10000 });
    const client = await pool.connect();

    const processedTables = [];

    for (const table of rawTables) {
      console.log(`Scanning table: ${table.name}`);
      try {
        const [rowCount, sampleRows, columnStats] = await Promise.all([
          getTableRowCount(client, table.name),
          getSampleRows(client, table.name),
          getColumnStats(client, table.name, table.columns || []),
        ]);

        const descriptions = await generateTableDescription({
          tableName: table.name,
          rowCount,
          sampleRows,
          columnStats,
          columns: table.columns || [],
        });

        processedTables.push({
          name: table.name,
          description: descriptions.tableDescription || table.description || null,
          rowCount,
          primaryKeys: table.primaryKeys || [],
          foreignKeys: table.foreignKeys || [],
          columns: (table.columns || []).map(col => ({
            name: col.name,
            type: col.type,
            nullable: col.nullable,
            description: descriptions.columns?.[col.name] || col.description || null,
            stats: columnStats[col.name] || null,
          })),
        });

      } catch (err) {
        console.error(`Failed to scan table ${table.name}:`, err.message);
        // Don't abort the whole scan — save what we have for this table
        processedTables.push({
          ...table,
          scanError: err.message,
        });
      }
    }

    client.release();
    await pool.end();

    await prisma.processedSchema.upsert({
      where: { companyId },
      create: {
        companyId,
        tables: processedTables,
        scanStatus: "DONE",
        lastScannedAt: new Date(),
      },
      update: {
        tables: processedTables,
        scanStatus: "DONE",
        lastScannedAt: new Date(),
        scanError: null,
      },
    });

    console.log(`Scan complete for company ${companyId}: ${processedTables.length} tables processed`);
    return { success: true, tablesProcessed: processedTables.length };

  } catch (err) {
    if (pool) await pool.end().catch(() => {});

    await prisma.processedSchema.upsert({
      where: { companyId },
      create: { companyId, tables: [], scanStatus: "FAILED", scanError: err.message },
      update: { scanStatus: "FAILED", scanError: err.message },
    });

    console.error(`Scan failed for company ${companyId}:`, err.message);
    throw err;
  }
};