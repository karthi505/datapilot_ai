import { LogOut } from 'lucide-react';
import { Button } from '../ui/button';

interface HeaderProps {
  title: string;
  userName: string;
  onLogout: () => void;
}

export function Header({ title, userName, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              DP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">DataPilot AI</h1>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-sm text-gray-600">{title}</span>
              </div>
              <p className="text-xs text-gray-500">Welcome, {userName}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onLogout} className="text-sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
