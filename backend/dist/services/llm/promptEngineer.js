export const formatSchemaForLLM = (schema) => {
  if (!schema || !schema.tables || schema.tables.length === 0) {
    return "No schema available";
  }

  // Ensure tables is an array
  const tables = Array.isArray(schema.tables) ? schema.tables : [];

  let formatted = "";

  for (const table of tables) {
    // Skip if no table name
    if (!table.name) continue;

    formatted += `\nTABLE: ${table.name}\n`;

    if (table.description) {
      formatted += `  Description: ${table.description}\n`;
    }

    formatted += `  Columns:\n`;

    // Ensure columns is an array
    const columns = Array.isArray(table.columns) ? table.columns : [];

    for (const column of columns) {
      const colName = column.name || column.column_name;
      const colType = column.type || column.data_type;

      // Skip if no column name
      if (!colName) continue;

      const nullable =
        column.nullable !== undefined
          ? column.nullable
          : column.is_nullable === "YES";

      formatted += `    - ${colName}`;

      if (colType) {
        formatted += ` (${colType})`;
      }

      if (!nullable) {
        formatted += ` NOT NULL`;
      }

      if (column.description) {
        formatted += ` // ${column.description}`;
      }

      formatted += `\n`;
    }

    // Add primary keys
    if (table.primaryKeys) {
      const pkArray = Array.isArray(table.primaryKeys)
        ? table.primaryKeys
        : [table.primaryKeys];
      if (pkArray.length > 0) {
        formatted += `  Primary Key: ${pkArray.join(", ")}\n`;
      }
    }

    // Add foreign keys with relationships
    if (table.foreignKeys) {
      const fkArray = Array.isArray(table.foreignKeys) ? table.foreignKeys : [];
      if (fkArray.length > 0) {
        formatted += `  Foreign Keys:\n`;
        for (const fk of fkArray) {
          formatted += `    - ${fk.column} -> ${fk.referencesTable}.${fk.referencesColumn}`;
          if (fk.onDelete) {
            formatted += ` (ON DELETE ${fk.onDelete})`;
          }
          formatted += `\n`;
        }
      }
    }

    // Add relationships (for manual schemas)
    if (table.relationships) {
      const relArray = Array.isArray(table.relationships)
        ? table.relationships
        : [];
      if (relArray.length > 0) {
        formatted += `  Relationships:\n`;
        for (const rel of relArray) {
          formatted += `    - ${rel.type}: ${rel.relatedTable}`;
          if (rel.foreignKey) {
            formatted += ` via ${rel.foreignKey}`;
          }
          if (rel.description) {
            formatted += ` (${rel.description})`;
          }
          formatted += `\n`;
        }
      }
    }

    formatted += `\n`;
  }

  return formatted.trim();
};

export const buildSQLPrompt = ({
  userPrompt,
  dbType = "postgresql",
  schema,
}) => {
  const formattedSchema = formatSchemaForLLM(schema);
  const dbUpper = dbType.toUpperCase();

  // console.log(formattedSchema);

  return `You are a SQL query generator. Your ONLY job is to generate valid SQL queries.

CRITICAL RULES - VIOLATION WILL RESULT IN FAILURE:


- You MUST use ONLY the tables and columns listed in the schema below
- The schema provided is COMPLETE and FINAL
- You are FORBIDDEN from assuming table names or column names
- You are FORBIDDEN from inventing tables, columns, joins, or conditions
- If the request cannot be answered using ONLY the provided schema,
  return EXACTLY: INVALID_SCHEMA
- Output ONE valid ${dbUpper} SQL query ONLY
- The SQL MUST be syntactically correct
- The SQL MUST accurately answer the user request
- No explanations, no markdown, no comments
- The query MUST end with a semicolon


DATABASE SCHEMA (${dbUpper}):


${formattedSchema}


AVAILABLE TABLES (use EXACTLY these names):
${schema.tables.map((t) => `  - ${t.name}`).join("\n")}


USER REQUEST:
"${userPrompt}"

GENERATE SQL QUERY:
`.trim();
};
