import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "./ui/spinner";
import { Company } from "../types";

interface UserRegistrationProps {
  onRegister: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }) => void;
  onBack: () => void;
  companies: Company[]; // Changed from string[] to Company[]
}

export function UserRegistration({
  onRegister,
  onBack,
  companies,
}: UserRegistrationProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      alert("Please select a company");
      return;
    }
    setIsLoading(true);
    try {
      await onRegister({ name, email, password, companyName });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>User Registration</CardTitle>
          </div>
          <CardDescription>Create a user account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-company">Select Company</Label>
              <Select value={companyName} onValueChange={setCompanyName}>
                <SelectTrigger id="user-company">
                  <SelectValue placeholder="Choose your company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No companies available
                    </SelectItem>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.name}>
                        {company.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={companies.length === 0 || isLoading}
            >
              {isLoading ? <><Spinner className="mr-2" /> Creating Account...</> : 'Create User Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
