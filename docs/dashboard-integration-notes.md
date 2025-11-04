# Dashboard Integration Notes for Reporting Module

## Overview

The new reporting and analytics endpoints provide rich data for dashboard visualizations and financial insights. This document outlines integration patterns and best practices for frontend consumption.

## Data Formats for Charts

### Account Balance Chart Data
Use `/api/reports/account-balance` endpoint to populate account overview charts:

```javascript
// Frontend data transformation for balance chart
const balanceData = accountBalances.map(account => ({
  label: account.accountName,
  current: account.currentBalance,
  inflow: account.totalIn,
  outflow: account.totalOut,
  netFlow: account.netFlow
}));
```

### Category Spending Pie Chart
Use `/api/reports/category-summary` with expense categories:

```javascript
// Transform for pie chart
const pieData = categorySummaries
  .filter(cat => cat.totalAmount > 0)
  .map(cat => ({
    name: cat.categoryName,
    value: cat.totalAmount,
    percentage: cat.percentage
  }));
```

### Trend Line Charts
Use `/api/reports/analytics?action=recurring-trends` for trend visualization:

```javascript
// Transform for line chart
const trendData = recurringTrends.map(trend => ({
  category: trend.categoryName,
  average: trend.averageAmount,
  trend: trend.trend, // 'increasing', 'decreasing', 'stable'
  frequency: trend.frequency
}));
```

## Real-time Updates

### Polling Strategy
For dashboards requiring real-time data:

```javascript
// Poll every 5 minutes for balance updates
setInterval(async () => {
  const balances = await fetch('/api/reports/account-balance');
  updateDashboard(balances);
}, 5 * 60 * 1000);
```

### WebSocket Integration (Future)
Consider implementing WebSocket connections for instant balance updates when transactions are posted.

## Caching Strategies

### Browser Cache
Cache analytics data for improved performance:

```javascript
// Cache expensive analytics for 1 hour
const cacheKey = `analytics-${action}-${Date.now()}`;
const cached = localStorage.getItem(cacheKey);
if (cached && (Date.now() - JSON.parse(cached).timestamp) < 3600000) {
  return JSON.parse(cached).data;
}
```

### Server-side Cache
Implement Redis or similar for frequently accessed reports.

## Error Handling

### Graceful Degradation
Handle API failures gracefully:

```javascript
try {
  const data = await fetch('/api/reports/analytics?action=top-expenses');
  if (!data.ok) throw new Error('Failed to load analytics');
  return await data.json();
} catch (error) {
  console.error('Analytics error:', error);
  // Show cached data or placeholder
  return getFallbackData();
}
```

## Performance Optimization

### Pagination Handling
For large datasets, implement virtual scrolling:

```javascript
// Load data in chunks
const loadMoreData = async (page) => {
  const response = await fetch(`/api/reports/movement-history?page=${page}&pageSize=50`);
  const newData = await response.json();
  setMovementHistory(prev => [...prev, ...newData.data]);
};
```

### Lazy Loading
Load analytics components only when needed:

```javascript
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

// In component
<Suspense fallback={<div>Loading analytics...</div>}>
  <AnalyticsDashboard />
</Suspense>
```

## Chart Library Recommendations

### For React Applications:
- **Recharts**: Flexible, React-native charts
- **Chart.js**: Lightweight with React wrapper
- **D3.js**: Advanced custom visualizations

### Example with Recharts:
```javascript
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ExpenseChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percentage }) => `${name}: ${percentage}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
);
```

## Mobile Responsiveness

### Responsive Breakpoints
Ensure charts adapt to mobile screens:

```css
@media (max-width: 768px) {
  .chart-container {
    height: 300px;
  }

  .pie-chart {
    font-size: 12px;
  }
}
```

## Accessibility

### Chart Accessibility
Add proper ARIA labels and descriptions:

```javascript
<PieChart
  aria-label="Expense breakdown by category"
  role="img"
>
  {/* Chart content */}
</PieChart>
```

### Keyboard Navigation
Ensure interactive charts are keyboard accessible.

## Data Export

### CSV Export
Allow users to export report data:

```javascript
const exportToCSV = (data, filename) => {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};
```

## Future Enhancements

### Predictive Analytics
Use forecast data for predictive charts showing projected balances.

### Custom Date Ranges
Implement date picker components for flexible reporting periods.

### Drill-down Capabilities
Allow users to click chart segments to view detailed transaction lists.

## Testing Integration

### Mock Data
Use the sample data from `tests/reporting-tests.ts` for component testing:

```javascript
import { sampleTestData } from '../../tests/reporting-tests';

// Use in tests
const mockBalances = sampleTestData.accounts;
```

This ensures consistent testing across frontend and backend components.
