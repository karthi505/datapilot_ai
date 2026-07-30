import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import databaseRoutes from "./routes/databaseRoutes.js";
import employeeManagementRoutes from "./routes/employeeManagementRoutes.js";
import roleManagementRoutes from "./routes/roleManagementRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";

const app = express();
const PORT = process.env.PORT || 5050;

// Dynamic CORS — allows localhost and any Vercel domain
app.use((req, res, next) => {
  const origin = req.headers.origin;

  const allowed =
    !origin ||
    origin.includes("localhost") ||
    origin.endsWith(".vercel.app");

  if (allowed) {
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/admin/employee-management", employeeManagementRoutes);
app.use("/api/admin/role-management", roleManagementRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/scan", scanRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});