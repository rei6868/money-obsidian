---
type: report
reportType: 
startDate: 
endDate: 
---

# Financial Report

Report Type: 
Start Date: 
End Date: 

```dataviewjs
// Dataview JS code to fetch and display report data from the backend API
// Example: Fetching account summary

const reportType = dv.current().reportType;
const startDate = dv.current().startDate;
const endDate = dv.current().endDate;

if (reportType === "account-summary") {
  const response = await fetch(`http://localhost:3000/api/reports/account-summary?startDate=${startDate}&endDate=${endDate}`);
  const data = await response.json();
  dv.markdownTable(["Account ID", "Opening Balance", "Closing Balance"],
    data.map(item => [item.accountId, item.openingBalance, item.closingBalance])
  );
} else {
  dv.paragraph("Please specify a valid reportType (e.g., account-summary).");
}
```
