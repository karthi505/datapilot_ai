//QueryOutput.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, CheckCircle, XCircle, Database } from "lucide-react";
import { Message } from "../../types";

interface QueryOutputProps {
  isLoading: boolean;
  output: Message | null;
}

export function QueryOutput({ isLoading, output }: QueryOutputProps) {
  const renderResults = () => {
    if (!output?.results || output.results.length === 0) {
      return (
        <div className="text-center py-8">
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No results returned</p>
        </div>
      );
    }

    // Get column names from the first result object
    const columns = Object.keys(output.results[0]);

    return (
      <div className="space-y-4">
        {/* Results count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {output.rowCount} {output.rowCount === 1 ? "row" : "rows"} returned
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {output.results.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {row[column] !== null && row[column] !== undefined
                        ? String(row[column])
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Card className="min-h-[400px]">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <FileText className="h-4 w-4 text-green-600" />
          </div>
          <CardTitle className="text-base">Query Output</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Processing query...</p>
            </div>
          </div>
        ) : output ? (
          <div className="space-y-4">
            {/* Status message */}
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                output.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {output.type === "success" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{output.content}</span>
            </div>

            {/* Generated SQL */}
            {output.generatedSql && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Generated SQL
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-green-400 font-mono">
                    {output.generatedSql}
                  </code>
                </div>
              </div>
            )}

            {/* Results table */}
            {output.type === "success" && renderResults()}

            {/* Query metadata */}
            {output.queryRequestId && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                Query ID: {output.queryRequestId}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Submit a query to see results here
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
