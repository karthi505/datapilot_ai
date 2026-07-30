import { useState, useEffect } from "react";
import { Header } from "../components/shared/Header";
import { NaturalLanguageQuery } from "../components/user/NaturalLanguageQuery";
import { QueryOutput } from "../components/user/QueryOutput";
import { QueryHistory } from "../components/user/QueryHistory";
import { AccessDenied } from "../components/user/AccessDenied";
import { User, Message, QueryHistoryItem } from "../types";

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  companyName: string;
}

export function UserDashboard({
  user,
  onLogout,
  companyName,
}: UserDashboardProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<Message | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [isCheckingEmployee, setIsCheckingEmployee] = useState(true);

  // Check if user is registered as an employee
  useEffect(() => {
    const checkEmployeeStatus = () => {
      setIsEmployee(user.isActive);
      setIsCheckingEmployee(false);
      fetchQueryHistory();
    };

    checkEmployeeStatus();
  }, [user.email, companyName]);

  const handleSubmitQuery = async () => {
    if (!input.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/query/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            prompt: input,
          }),
        },
      );

      const data = await response.json();

      console.log(data);
      if (!response.ok) {
        setCurrentOutput({
          type: "error",
          content: data.message || "Failed to execute query",
          timestamp: new Date(),
          generatedSql: data.generatedSql,
          queryRequestId: data.queryRequestId,
        });
        setIsLoading(false);
        return;
      }

      const historyItem: QueryHistoryItem = {
        id: data.data.queryRequestId,
        query: input,
        timestamp: new Date(data.data.executedAt),
        generatedSql: data.data.generatedSql,
        rowCount: data.data.rowCount,
      };

      setQueryHistory((prev) => [historyItem, ...prev]);

      setCurrentOutput({
        type: "success",
        content: data.message,
        timestamp: new Date(data.data.executedAt),
        generatedSql: data.data.generatedSql,
        results: data.data.results,
        rowCount: data.data.rowCount,
        queryRequestId: data.data.queryRequestId,
        generatedQueryId: data.data.generatedQueryId,
      });

      setInput("");
    } catch (error) {
      console.error("Query submission error:", error);
      setCurrentOutput({
        type: "error",
        content: "Network error. Please check your connection and try again.",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuery = (query: string) => {
    setInput(query);
  };

  const fetchQueryHistory = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/query/history?page=1&limit=50`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to fetch query history:", data.message);
        return;
      }

      const transformedHistory: QueryHistoryItem[] = data.data.queries.map(
        (item: { id: string; naturalLanguagePrompt: string; createdAt: string; generatedSql?: string }) => ({
          id: item.id,
          query: item.naturalLanguagePrompt,
          timestamp: new Date(item.createdAt),
          generatedSql: item.generatedSql || "",
          rowCount: undefined,
        }),
      );

      setQueryHistory(transformedHistory);
    } catch (error) {
      console.error("Error fetching query history:", error);
    }
  };

  if (!isEmployee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title="Employee Dashboard"
          userName={user.name}
          onLogout={onLogout}
        />
        <AccessDenied email={user.email} companyName={user.companyName} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Employee Dashboard"
        userName={user.name}
        onLogout={onLogout}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <NaturalLanguageQuery
              input={input}
              isLoading={isLoading}
              onInputChange={setInput}
              onSubmit={handleSubmitQuery}
            />
            <QueryOutput isLoading={isLoading} output={currentOutput} />
          </div>

          <div className="lg:col-span-1">
            <QueryHistory
              history={queryHistory}
              onSelectQuery={handleSelectQuery}
            />
          </div>
        </div>
      </main>
    </div>
  );
}