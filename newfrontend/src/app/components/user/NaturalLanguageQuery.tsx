import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send } from 'lucide-react';
import { Spinner } from '../ui/spinner';

interface NaturalLanguageQueryProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

export function NaturalLanguageQuery({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: NaturalLanguageQueryProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Send className="h-4 w-4 text-blue-600" />
          </div>
          <CardTitle className="text-base">Natural Language Query</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Enter your query in natural language... e.g., "Show all customers from New York who made purchases in the last month"'
          className="resize-none min-h-[120px] text-sm"
          rows={5}
        />
        <Button
          onClick={onSubmit}
          disabled={isLoading || !input.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <><Spinner className="mr-2" /> Submitting...</>
          ) : (
            <><Send className="h-4 w-4 mr-2" /> Submit Query</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
