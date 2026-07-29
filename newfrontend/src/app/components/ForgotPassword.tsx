import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Spinner } from "./ui/spinner";

interface ForgotPasswordProps {
  onSubmit: (email: string) => void;
  onBack: () => void;
}

export function ForgotPassword({ onSubmit, onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription><span className="text-blue-600 font-medium">DataPilot AI</span> — We’ll send an OTP to your email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Spinner className="mr-2" /> Sending OTP...</> : 'Send OTP'}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
