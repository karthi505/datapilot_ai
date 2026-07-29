// middleware/authMiddleware.js
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

// Authenticate user with JWT
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user is inactive",
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    console.error("Authentication Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user.userType !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

// Check if user belongs to specific company
export const checkCompanyAccess = (req, res, next) => {
  const companyId = req.params.companyId || req.body.companyId;

  if (req.user.userType !== "ADMIN" && req.user.companyId !== companyId) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You do not have access to this company.",
    });
  }
  next();
};
