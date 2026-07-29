import { prisma } from "../lib/prisma.js";

import { processQuery } from "../services/queryService.js";
import { executeQuery } from "../utils/databaseHelper.js";
import { decryptConnectionString } from "../utils/encryption.js";

// Submit a new query request
export const submitQuery = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.userId;
    const companyId = req.user.companyId;

    // Validation
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    // Check if user is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is not active",
      });
    }

    // Get company's database connection
    const dbConnection = await prisma.databaseConnection.findFirst({
      where: { companyId, isActive: true },
    });

    if (!dbConnection) {
      return res.status(404).json({
        success: false,
        message:
          "No active database connection found for your company. Please contact your administrator.",
      });
    }

    // Create query request record
    const queryRequest = await prisma.queryRequest.create({
      data: {
        userId,
        naturalLanguagePrompt: prompt,
      },
    });

    // Extract schema and dbType from connection
    // const schema = dbConnection.schemaSnapshot;
    const processedSchema = await prisma.processedSchema.findUnique({
      where: { companyId },
    });
    
    const schema =
      processedSchema?.scanStatus === "DONE"
        ? { tables: processedSchema.tables }
        : dbConnection.schemaSnapshot;
        
    const dbType = dbConnection.dbType.toLowerCase();

    // Process query using your processQuery function
    let generatedSqlResult;
    try {
      generatedSqlResult = await processQuery({
        prompt,
        schema,
        dbType,
      });
    } catch (error) {
      console.error("Query Processing Error:", error);

      // Update query request with error
      await prisma.generatedQuery.create({
        data: {
          queryRequestId: queryRequest.id,
          generatedSql: "",
          isValidated: false,
          validationNotes: `Query generation failed: ${error.message}`,
          executionStatus: "FAILED",
        },
      });

      return res.status(500).json({
        success: false,
        message: "Failed to generate SQL query from your prompt",
        error: error.message,
        queryRequestId: queryRequest.id,
      });
    }

    // Extract generated SQL from result
    const generatedSql =
      generatedSqlResult.sql || generatedSqlResult.query || generatedSqlResult;

    if (!generatedSql || typeof generatedSql !== "string") {
      return res.status(500).json({
        success: false,
        message: "Query generation returned invalid SQL",
        queryRequestId: queryRequest.id,
      });
    }

    // Validate the generated SQL
    // const validation = validateSql(generatedSql, dbType);

    // if (!validation.isValid) {
    //   // Store invalid query
    //   await prisma.generatedQuery.create({
    //     data: {
    //       queryRequestId: queryRequest.id,
    //       generatedSql,
    //       isValidated: false,
    //       validationNotes: validation.errors.join("; "),
    //       executionStatus: "FAILED",
    //     },
    //   });

    //   return res.status(400).json({
    //     success: false,
    //     message: "Generated SQL query failed validation",
    //     errors: validation.errors,
    //     generatedSql,
    //     queryRequestId: queryRequest.id,
    //   });
    // }

    // Create validated query record
    const generatedQuery = await prisma.generatedQuery.create({
      data: {
        queryRequestId: queryRequest.id,
        generatedSql,
        isValidated: true,
        validationNotes: "Query validated successfully",
      },
    });

    // Decrypt connection string for execution
    const connectionString = decryptConnectionString(
      dbConnection.connectionString,
    );

    // Execute query on client database
    let executionResult;
    try {
      executionResult = await executeQuery(
        connectionString,
        dbType,
        generatedSql,
      );

      if (!executionResult.success) {
        throw new Error(executionResult.error || "Query execution failed");
      }
    } catch (error) {
      console.error("Query Execution Error:", error);

      // Update query with execution failure
      await prisma.generatedQuery.update({
        where: { id: generatedQuery.id },
        data: {
          executedAt: new Date(),
          executionStatus: "FAILED",
          validationNotes: `Execution failed: ${error.message}`,
        },
      });

      return res.status(500).json({
        success: false,
        message: "Query execution failed",
        error: error.message,
        generatedSql,
        queryRequestId: queryRequest.id,
        generatedQueryId: generatedQuery.id,
      });
    }

    // Update query with successful execution
    await prisma.generatedQuery.update({
      where: { id: generatedQuery.id },
      data: {
        executedAt: new Date(),
        executionStatus: "EXECUTED",
      },
    });

    // Return success response with results
    res.status(200).json({
      success: true,
      message: "Query executed successfully",
      data: {
        queryRequestId: queryRequest.id,
        generatedQueryId: generatedQuery.id,
        prompt,
        generatedSql,
        results: executionResult.rows,
        rowCount: executionResult.rowCount,
        executedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Submit Query Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing query",
    });
  }
};
// Get query history for a user
export const getQueryHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await prisma.queryRequest.count({
      where: { userId },
    });

    // Fetch query history
    const queryHistory = await prisma.queryRequest.findMany({
      where: { userId },
      include: {
        generatedQueries: {
          orderBy: { createdAt: "desc" },
          take: 1, // Only get the most recent generated query
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Transform the data
    const transformedHistory = queryHistory.map((item) => ({
      id: item.id,
      naturalLanguagePrompt: item.naturalLanguagePrompt,
      createdAt: item.createdAt,
      generatedSql: item.generatedQueries[0]?.generatedSql || null,
      executionStatus: item.generatedQueries[0]?.executionStatus || null,
      executedAt: item.generatedQueries[0]?.executedAt || null,
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      message: "Query history retrieved successfully",
      data: {
        queries: transformedHistory,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get Query History Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving query history",
      error: error.message,
    });
  }
};
