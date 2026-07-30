import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, sendOTPEmail } from "../services/emailService.js";

// Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;

    if (!name || !email || !password || !companyId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        companyId,
        userType: "EMPLOYEE",
        otp,
        otpExpiry,
        verified: false,
        isActive: false,
      },
    });

    // Send OTP email — non-blocking
    try {
      await sendOTPEmail(email, otp, name);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      console.log(`🔐 OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email with OTP.",
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Register User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Register Admin
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName },
      });

      const admin = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          companyId: company.id,
          userType: "ADMIN",
          otp,
          otpExpiry,
          verified: false,
        },
      });

      return { company, admin };
    });

    // Send OTP email — non-blocking
    try {
      await sendOTPEmail(email, otp, name);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      console.log(`🔐 OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message: "Admin registered successfully. Please verify your email with OTP.",
      data: {
        userId: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        userType: result.admin.userType,
        companyId: result.company.id,
        companyName: result.company.name,
      },
    });
  } catch (error) {
    console.error("Register Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during admin registration",
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        companyId: user.companyId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          companyId: user.companyId,
          companyName: user.company.name,
          isActive: user.isActive,
          roles: user.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.roleName,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
        verified: updatedUser.verified,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });

    // Send OTP email — non-blocking
    try {
      await sendOTPEmail(email, otp, user.name);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      console.log(`🔐 Resent OTP for ${email}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: "OTP has been resent to your email",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// Get User Info
export const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        companyId: true,
        createdAt: true,
        lastLoginAt: true,
        isActive: true,
        verified: true,
        company: true,
        userRoles: {
          select: {
            role: {
              select: {
                rolePermissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          companyId: user.companyId,
          companyName: user.company.name,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          isActive: user.isActive,
          verified: user.verified,
          roles: user.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.roleName,
            description: ur.role.description,
            permissions: ur.role.rolePermissions,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Get User Info Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user info",
    });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });

    // Send OTP email — non-blocking
    try {
      await sendOTPEmail(email, otp, user.name);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      console.log(`🔐 Forgot Password OTP for ${email}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to email for password reset",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Verify OTP For Reset
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified. You may reset your password.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};