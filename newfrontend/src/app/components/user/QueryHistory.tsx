import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { History, Clock } from 'lucide-react';
import { QueryHistoryItem } from '../../types';

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (query: string) => void;
}

export function QueryHistory({ history, onSelectQuery }: QueryHistoryProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <History className="h-4 w-4 text-purple-600" />
          </div>
          <CardTitle className="text-base">Query History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-400">No queries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
                onClick={() => onSelectQuery(item.query)}
              >
                <p className="text-sm text-gray-700 line-clamp-2 mb-1">{item.query}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{item.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
