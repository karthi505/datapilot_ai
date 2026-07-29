import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Spinner } from "./ui/spinner";

interface ResetPasswordProps {
  email: string;
  onReset: (otp: string, password: string) => void;
  onBack: () => void;
}

export function ResetPassword({
  email,
  onReset,
  onBack,
}: ResetPasswordProps) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await onReset(otp, password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter OTP sent to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>OTP</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Spinner className="mr-2" /> Resetting...</> : 'Reset Password'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onBack}
            >
              Back
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
//for reset password
export const resetPassword = async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
  
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields required" });
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
  