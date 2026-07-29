//new
import { useState } from "react";
import { roleService } from "../../services/roleService";

interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
}

interface DatabaseViewerProps {
  onBack: () => void;
  databaseTables: string[];
}

export function DatabaseViewer({
  onBack,
  databaseTables,
}: DatabaseViewerProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleTableClick = async (tableName: string) => {
    setSelectedTable(tableName);
    setLoadingTable(true);
    setError(null);
    setTableData(null);

    try {
      // Fetch table data via roleService or a dedicated tableService
      const data = await roleService.getTableData(tableName);
      setTableData(data);
    } catch (err) {
      setError("Failed to load table data. Please try again.");
      console.error(err);
    } finally {
      setLoadingTable(false);
    }
  };

  const filteredTables = databaseTables.filter((t) =>
    t.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </button>
        <div className="h-5 w-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4-8 4s8 1.79 8 4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              Database Explorer
            </h1>
            <p className="text-xs text-gray-500">
              {databaseTables.length} tables detected · PostgreSQL
            </p>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar - Table List */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Tables
            </p>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {filteredTables.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No tables found
              </p>
            ) : (
              filteredTables.map((table) => (
                <button
                  key={table}
                  onClick={() => handleTableClick(table)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors group ${
                    selectedTable === table
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 flex-shrink-0 ${selectedTable === table ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18M10 4v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"
                    />
                  </svg>
                  <span className="truncate font-medium">{table}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {!selectedTable ? (
            /* Welcome State - Table Grid */
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Tables
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Click any table to explore its contents
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {databaseTables.map((table, index) => (
                  <button
                    key={table}
                    onClick={() => handleTableClick(table)}
                    className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M3 14h18M10 4v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {table}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Table #{index + 1}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : loadingTable ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">
                Loading{" "}
                <span className="font-semibold text-gray-700">
                  {selectedTable}
                </span>
                ...
              </p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                onClick={() => handleTableClick(selectedTable)}
                className="text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : tableData ? (
            /* Table Data View */
            <div className="p-6">
              {/* Table Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedTable}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {tableData.rows.length} rows · {tableData.columns.length}{" "}
                    columns
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Live Data
                  </span>
                </div>
              </div>

              {/* Data Table */}
              {tableData.rows.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <svg
                    className="w-10 h-10 text-gray-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">
                    This table is empty
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    No records found in{" "}
                    <span className="font-medium">{selectedTable}</span>
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">
                            #
                          </th>
                          {tableData.columns.map((col) => (
                            <th
                              key={col}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tableData.rows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="hover:bg-blue-50/40 transition-colors"
                          >
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                              {rowIndex + 1}
                            </td>
                            {tableData.columns.map((col) => (
                              <td
                                key={col}
                                className="px-4 py-3 text-gray-700 max-w-xs"
                              >
                                {row[col] === null || row[col] === undefined ? (
                                  <span className="text-gray-300 italic text-xs">
                                    null
                                  </span>
                                ) : typeof row[col] === "boolean" ? (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row[col] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                  >
                                    {String(row[col])}
                                  </span>
                                ) : (
                                  <span
                                    className="truncate block max-w-[200px]"
                                    title={String(row[col])}
                                  >
                                    {String(row[col])}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
