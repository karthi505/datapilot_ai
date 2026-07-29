import { useState, useEffect } from "react";
import { AuthPage } from "./components/AuthPage";
import { AdminRegistration } from "./components/AdminRegistration";
import { UserRegistration } from "./components/UserRegistration";
import { OTPVerification } from "./components/OTPVerification";
import { AdminDashboard } from "./pages/AdminDashboard";
import { UserDashboard } from "./pages/UserDashboard";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { authService } from "./services/authService";
import { User, PendingUser, Page, Company } from "./types";
//new
import { ForgotPassword } from "./components/ForgotPassword";
import { ResetPassword } from "./components/ResetPassword";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("auth");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [resetEmail, setResetEmail] = useState<string>("");

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUsers = authService.getUsers();
    const savedCompanies = authService.getCompanies();
    const savedCurrentUser = authService.getCurrentUser();

    // setUsers(savedUsers);
    // setCompanies(savedCompanies);

    if (savedCurrentUser) {
      setCurrentUser(savedCurrentUser);
      setCurrentPage("dashboard");
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    authService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    authService.saveCompanies(companies);
  }, [companies]);

  useEffect(() => {
    authService.saveCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Function to fetch companies
  const fetchCompanies = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/companies/`,
      );
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to fetch companies");
        return;
      }

      // Set companies with id and name
      setCompanies(result.data.companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies. Please try again.");
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle different error cases
        toast.error(result.message || "Login failed");
        return;
      }

      // Login successful
      const { token, user } = result.data;

      // Store token in localStorage or sessionStorage
      localStorage.setItem("authToken", token);

      // Set current user with all the data from backend
      const loggedInUser: User = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.userType.toLowerCase(), // Convert ADMIN/USER to admin/user
        userType: user.userType,
        companyId: user.companyId,
        companyName: user.companyName,
        roles: user.roles,
        verified: true,
        isActive: user.isActive,
        password: "", // Don't store password in state
      };

      setCurrentUser(loggedInUser);
      setCurrentPage("dashboard");
      toast.success(result.message || "Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleAdminRegister = async (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register/admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            password: data.password,
            companyName: data.companyName,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle error responses (400, 500, etc.)
        toast.error(result.message || "Registration failed");
        return;
      }

      // Registration successful
      setPendingUser({
        ...data,
        role: "admin",
        verified: false,
        userId: result.data.userId,
        companyId: result.data.companyId,
        companyName: result.data.companyName,
        // Note: OTP is NOT sent in response (security), it's emailed to the user
      });

      setCurrentPage("otp");
      toast.success(
        result.message || "Verification code sent to " + data.email,
      );
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleUserRegister = async (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }) => {
    try {
      // Find company ID from the companies list
      const company = companies.find(
        (c: Company) => c.name === data.companyName,
      );

      if (!company) {
        toast.error("Please select a valid company");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register/user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            password: data.password,
            companyId: company.id, // Send companyId to backend
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle error responses
        toast.error(result.message || "Registration failed");
        return;
      }

      // Registration successful
      setPendingUser({
        ...data,
        role: "user",
        verified: false,
        userId: result.data.userId,
        userType: result.data.userType,
        companyId: company.id,
      });

      setCurrentPage("otp");
      toast.success(
        result.message || "Verification code sent to " + data.email,
      );
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleOtpResend = async () => {
    if (!pendingUser?.email) {
      toast.error("No email found. Please register again.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/resend-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: pendingUser.email,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle error responses
        toast.error(result.message || "Failed to resend OTP");
        return;
      }

      // OTP resent successfully
      toast.success(result.message || "OTP has been resent to your email");
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleOTPVerify = async (otp: string) => {
    if (!pendingUser) {
      toast.error("No pending user found");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: pendingUser.email,
            otp: otp,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle different error cases
        toast.error(result.message || "OTP verification failed");
        return;
      }

      // OTP verification successful
      const verifiedUser: User = {
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        companyName: pendingUser.companyName,
        role: pendingUser.role,
        verified: true,
        userId: result.data.userId,
        companyId: pendingUser.companyId,
      };

      setUsers([...users, verifiedUser]);

      // If admin, add company to list
      if (verifiedUser.role === "admin") {
        setCompanies([...companies, verifiedUser.companyName]);
      }

      setCurrentUser(verifiedUser);
      setPendingUser(null);
      setCurrentPage("dashboard");
      toast.success(result.message || "Account verified successfully!");
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };
  const handleLogout = () => {
    console.log("logouttt");
    localStorage.removeItem("authToken");
    localStorage.removeItem("users");
    setCurrentUser(null);
    setCurrentPage("auth");
    toast.success("Logged out successfully");
  };

  return (
    <div>
      <Toaster />

      {currentPage === "auth" && (
        <AuthPage
          onLogin={handleLogin}
          onSwitchToAdminRegister={() => setCurrentPage("admin-register")}
          onSwitchToUserRegister={() => setCurrentPage("user-register")}
          onForgotPassword={() => setCurrentPage("forgot-password")} // 👈 ADD THIS
        />
      )}
      {/* //new */}
      {currentPage === "forgot-password" && (
        <ForgotPassword
          onSubmit={async (email) => {
            try {
              await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                },
              );

              setResetEmail(email);
              toast.success("OTP sent to your email");
              setCurrentPage("reset-password");
            } catch {
              toast.error("Failed to send OTP");
            }
          }}
          onBack={() => setCurrentPage("auth")}
        />
      )}
      {/* //new */}
      {currentPage === "reset-password" && (
        <ResetPassword
          email={resetEmail}
          onReset={async (otp, password) => {
            try {
              const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: resetEmail,
                    otp,
                    newPassword: password,
                  }),
                },
              );

              const result = await response.json();

              if (!response.ok) {
                toast.error(result.message || "Reset failed");
                return;
              }

              toast.success("Password reset successful");
              setCurrentPage("auth");
            } catch {
              toast.error("Network error");
            }
          }}
          onBack={() => setCurrentPage("auth")}
        />
      )}

      {currentPage === "admin-register" && (
        <AdminRegistration
          onRegister={handleAdminRegister}
          onBack={() => setCurrentPage("auth")}
        />
      )}

      {currentPage === "user-register" && (
        <UserRegistration
          onRegister={handleUserRegister}
          onBack={() => setCurrentPage("auth")}
          companies={companies}
        />
      )}

      {currentPage === "otp" && pendingUser && (
        <OTPVerification
          email={pendingUser.email}
          onVerify={handleOTPVerify}
          onResend={handleOtpResend}
        />
      )}

      {currentPage === "dashboard" && currentUser && (
        <>
          {currentUser.role === "admin" ? (
            <AdminDashboard user={currentUser} onLogout={handleLogout} />
          ) : (
            <UserDashboard
              user={currentUser}
              onLogout={handleLogout}
              companyName={currentUser.companyName}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
