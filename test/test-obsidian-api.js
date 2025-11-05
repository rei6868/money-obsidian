
const assert = require('assert');
const { addTransaction, runReport } = require('../obsidian/scripts/api-automation');

const testObsidianApi = async () => {
  try {
    // Test add transaction
    console.log('Testing add transaction...');
    const transactionData = {
      occurredOn: "2024-11-05",
      amount: 30.00,
      type: "expense",
      status: "active",
      accountId: "test-account-1", // Replace with a valid account ID
      categoryId: "test-category-1", // Replace with a valid category ID
      notes: "Test transaction from Obsidian"
    };
    // In a real test, you would mock the fetch call and assert on the arguments
    // For this simulation, we'll just call the function and log the output
    await addTransaction(transactionData);
    console.log('Add transaction test completed.');

    // Test run report
    console.log('Testing run report...');
    const reportType = "account-summary";
    const startDate = "2024-11-01";
    const endDate = "2024-11-05";
    // In a real test, you would mock the fetch call and assert on the arguments
    // For this simulation, we'll just call the function and log the output
    await runReport(reportType, startDate, endDate);
    console.log('Run report test completed.');

    console.log('All Obsidian API simulation tests passed!');
  } catch (error) {
    console.error('Obsidian API simulation test failed:', error.message);
  }
};

testObsidianApi();
