import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Message } from '../../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface VisualizationRendererProps {
  visualization: Message['visualization'];
}

export function VisualizationRenderer({ visualization }: VisualizationRendererProps) {
  if (!visualization) return null;

  const { type, data } = visualization;

  if (type === 'table') {
    const columns = Object.keys(data[0] || {});
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="capitalize">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col}>{row[col]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (type === 'bar') {
    const keys = Object.keys(data[0] || {}).filter(
      (key) => key !== 'month' && key !== 'category'
    );
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={data[0]?.month ? 'month' : 'category'} />
          <YAxis />
          <Tooltip />
          <Legend />
          {keys.map((key, idx) => (
            <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    const keys = Object.keys(data[0] || {}).filter((key) => key !== 'month');
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          {keys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[idx % COLORS.length]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
