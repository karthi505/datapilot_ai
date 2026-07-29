import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';
import { Employee } from '../../types';

interface StatsCardsProps {
  employees: Employee[];
}

export function StatsCards({ employees }: StatsCardsProps) {
  const activeCount = employees.filter(e => e.status === 'active').length;
  const inactiveCount = employees.filter(e => e.status === 'inactive').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">{employees.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Active</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">{activeCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Inactive</CardTitle>
          <Users className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">{inactiveCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
