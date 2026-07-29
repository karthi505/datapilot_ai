import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Spinner } from './ui/spinner';

interface AuthPageProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToAdminRegister: () => void;
  onSwitchToUserRegister: () => void;
  onForgotPassword: () => void;

}

export function AuthPage({ onLogin, onSwitchToAdminRegister, onSwitchToUserRegister,  onForgotPassword //new
}: AuthPageProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(loginEmail, loginPassword);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
            DP
          </div>
          <CardTitle className="text-2xl">DataPilot AI</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Spinner className="mr-2" /> Signing In...</> : 'Sign In'}
                </Button>
                {/* //new */}
                <div className="text-right">
                  <Button
                    type="button"
                     variant="link"
                     className="px-0 text-sm"
                      onClick={onForgotPassword}
                 >
                      Forgot password?
                  </Button>
                </div>

              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onSwitchToAdminRegister}
                >
                  Register as Admin
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onSwitchToUserRegister}
                >
                  Register as User
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
