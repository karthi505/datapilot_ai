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

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:8081",
      "https://mini-project-woad-eight.vercel.app",
      "https://mini-project-indol-six.vercel.app",
      "https://datapilot-bhxwnsoph-karthikxkrishnas-6471s-projects.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/admin/employee-management", employeeManagementRoutes);
app.use("/api/admin/role-management", roleManagementRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/scan", scanRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server ONLY if not on Vercel
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;