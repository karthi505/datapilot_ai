import { Message } from '../types';

export const queryService = {
  // Generate mock response based on query
  generateMockResponse: (query: string): Message => {
    const lowerQuery = query.toLowerCase();

    // Sales data
    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Here is the sales data for the last 6 months:',
        visualization: {
          type: 'bar',
          data: [
            { month: 'Jan', sales: 45000, target: 40000 },
            { month: 'Feb', sales: 52000, target: 45000 },
            { month: 'Mar', sales: 48000, target: 50000 },
            { month: 'Apr', sales: 61000, target: 55000 },
            { month: 'May', sales: 55000, target: 52000 },
            { month: 'Jun', sales: 67000, target: 60000 },
          ],
        },
      };
    }

    // Performance metrics
    if (lowerQuery.includes('performance') || lowerQuery.includes('metric')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Here are the key performance metrics:',
        visualization: {
          type: 'table',
          data: [
            { metric: 'Customer Satisfaction', value: '94%', trend: '+5%' },
            { metric: 'Response Time', value: '2.3s', trend: '-12%' },
            { metric: 'Conversion Rate', value: '3.2%', trend: '+8%' },
            { metric: 'Active Users', value: '12,450', trend: '+15%' },
            { metric: 'Revenue Growth', value: '23%', trend: '+3%' },
          ],
        },
      };
    }

    // Market share
    if (lowerQuery.includes('market') || lowerQuery.includes('share') || lowerQuery.includes('distribution')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Here is the market share distribution:',
        visualization: {
          type: 'pie',
          data: [
            { name: 'Product A', value: 35 },
            { name: 'Product B', value: 28 },
            { name: 'Product C', value: 22 },
            { name: 'Product D', value: 15 },
          ],
        },
      };
    }

    // Growth trend
    if (lowerQuery.includes('growth') || lowerQuery.includes('trend')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Here is the growth trend over the last year:',
        visualization: {
          type: 'line',
          data: [
            { month: 'Jan', users: 1200, revenue: 45000 },
            { month: 'Feb', users: 1450, revenue: 52000 },
            { month: 'Mar', users: 1600, revenue: 48000 },
            { month: 'Apr', users: 1850, revenue: 61000 },
            { month: 'May', users: 2100, revenue: 55000 },
            { month: 'Jun', users: 2400, revenue: 67000 },
          ],
        },
      };
    }

    // Employee data
    if (lowerQuery.includes('employee') || lowerQuery.includes('team') || lowerQuery.includes('staff')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Here is the employee data by department:',
        visualization: {
          type: 'table',
          data: [
            { department: 'Engineering', employees: 45, budget: '$450,000' },
            { department: 'Sales', employees: 32, budget: '$320,000' },
            { department: 'Marketing', employees: 18, budget: '$180,000' },
            { department: 'HR', employees: 8, budget: '$80,000' },
            { department: 'Operations', employees: 25, budget: '$250,000' },
          ],
        },
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: 'Here is some sample data based on your query:',
      visualization: {
        type: 'bar',
        data: [
          { category: 'Category A', value: 65 },
          { category: 'Category B', value: 78 },
          { category: 'Category C', value: 45 },
          { category: 'Category D', value: 92 },
          { category: 'Category E', value: 58 },
        ],
      },
    };
  },

  // Simulate API call with delay
  executeQuery: async (query: string): Promise<Message> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = queryService.generateMockResponse(query);
        resolve(response);
      }, 1000);
    });
  },
};
