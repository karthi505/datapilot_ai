import { buildSQLPrompt } from "./llm/promptEngineer.js";
import { callLLM } from "./llm/llmClient.js";

export const processQuery = async ({
  prompt,
  schema,
  dbType = "postgresql",
}) => {
  const llmPrompt = buildSQLPrompt({
    userPrompt: prompt,
    schema,
    dbType,
  });
  const rawResponse = await callLLM(llmPrompt);

  if (!rawResponse) {
    throw new Error("Empty response from LLM");
  }

  if (rawResponse.trim() === "INVALID_SCHEMA") {
    throw new Error("The request cannot be answered using the provided schema");
  }

  let sql = rawResponse.trim().replace(/\s+/g, " ");

  // Read-only enforcement
  if (!/^SELECT/i.test(sql)) {
    throw new Error("Only SELECT queries are allowed");
  }

  // Semicolon enforcement
  if (!sql.endsWith(";")) {
    sql += ";";
  }
  // console.log(sql);

  return sql;
};
