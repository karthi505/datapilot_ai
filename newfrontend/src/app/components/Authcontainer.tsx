import { useState } from "react";
import { AuthPage } from "./AuthPage";
import { ForgotPassword } from "./ForgotPassword";

export function AuthContainer() {
  const [page, setPage] = useState<"auth" | "forgot">("auth");

  //  login handler
  const handleLogin = (email: string, password: string) => {
    console.log("Login:", email, password);
  };

  // forgot password handler
  const handleSendOtp = (email: string) => {
    console.log("Send OTP to:", email);
    // call backend API here
    setPage("auth"); // or move to reset page later
  };

  // page switching
  if (page === "forgot") {
    return (
      <ForgotPassword
        onSubmit={handleSendOtp}
        onBack={() => setPage("auth")}
      />
    );
  }

  return (
    <AuthPage
        onLogin={handleLogin}
        onSwitchToAdminRegister={() => setCurrentPage("admin-register")}
        onSwitchToUserRegister={() => setCurrentPage("user-register")}
        onForgotPassword={() => setCurrentPage("forgot-password")} // new
/>

  );
}
