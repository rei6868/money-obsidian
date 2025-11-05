
// This script will simulate API calls from Obsidian

const addTransaction = async (transactionData) => {
  try {
    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });
    const data = await response.json();
    console.log('Transaction added:', data);
  } catch (error) {
    console.error('Error adding transaction:', error);
  }
};

const runReport = async (reportType, startDate, endDate) => {
  try {
    const response = await fetch(`http://localhost:3000/api/reports/${reportType}?startDate=${startDate}&endDate=${endDate}`);
    const data = await response.json();
    console.log('Report data:', data);
  } catch (error) {
    console.error('Error running report:', error);
  }
};

// Example usage:
// addTransaction({
//   occurredOn: "2024-11-05",
//   amount: 25.50,
//   type: "expense",
//   status: "active",
//   accountId: "some-account-id",
//   categoryId: "some-category-id",
//   notes: "Coffee and pastry"
// });

// runReport("account-summary", "2024-11-01", "2024-11-05");
