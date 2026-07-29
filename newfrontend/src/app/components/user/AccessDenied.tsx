import { Card, CardContent } from '../ui/card';
import { UserX } from 'lucide-react';

interface AccessDeniedProps {
  email: string;
  companyName: string;
}

export function AccessDenied({ email, companyName }: AccessDeniedProps) {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <Card className="text-center">
        <CardContent className="py-16">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <UserX className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You have not been added as an employee to this company yet. Please contact your
            administrator to grant you access to the dashboard.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto text-left">
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-medium">Your Email:</span> {email}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Company:</span> {companyName}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
