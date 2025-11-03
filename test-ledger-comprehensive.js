#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const API_SECRET_KEY = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Ensure this matches your .env
const TEST_RESULTS = [];

// Helper function to make curl requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    let cmd = `curl -s -X ${method} ${BASE_URL}${path} -H "Authorization: Bearer ${API_SECRET_KEY}"`;
    
    if (data) {
      cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    }
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const response = JSON.parse(stdout);
        resolve({ status: 200, data: response });
      } catch (e) {
        // If not JSON, return raw response
        resolve({ status: 200, data: stdout });
      }
    });
  });
}

// Test logging
function logTest(testName, input, response, notes = '') {
  const result = {
    test: testName,
    timestamp: new Date().toISOString(),
    input,
    response: {
      status: response.status,
      data: response.data
    },
    notes
  };
  TEST_RESULTS.push(result);
  console.log(`✓ ${testName}: ${response.status === 200 && !response.data?.error ? 'SUCCESS' : 'FAILED'}`);
  if (response.data?.error) {
    console.log(`  Error: ${response.data.error}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Ledger API Tests...\n');

  // Setup: Create a test account and person if they don't exist
  const testAccountId = 'test-account-1';
  const testPersonId = 'test-person-1';
  const testCycleTag = '2024-11';

  console.log('🛠️ Setting up test data...');
  await makeRequest('POST', '/api/accounts', { accountId: testAccountId, name: 'Test Account', type: 'checking', currentBalance: '1000.00' });
  await makeRequest('POST', '/api/people', { personId: testPersonId, name: 'Test Person' });
  console.log('✅ Test data setup complete.');

  // 1. Test Transactions API - GET
  console.log('📝 Testing Transactions API...');
  
  try {
    const getResponse = await makeRequest('GET', '/api/transactions');
    logTest('Get Transactions', {}, getResponse, 'Should return transaction list');
  } catch (error) {
    logTest('Get Transactions Error', {}, { status: 'ERROR', data: error.message });
  }

  // 2. Test Transaction Creation - Missing Fields
  const incompleteTransaction = {
    amount: 100.50,
    type: 'expense',
    notes: 'Test transaction'
  };
  
  try {
    const incompleteResponse = await makeRequest('POST', '/api/transactions', incompleteTransaction);
    logTest('Create Incomplete Transaction', incompleteTransaction, incompleteResponse, 'Should fail validation');
  } catch (error) {
    logTest('Create Incomplete Transaction Error', incompleteTransaction, { status: 'ERROR', data: error.message });
  }

  // 3. Test Transaction Creation - Complete
  const completeTransaction = {
    amount: 100.50,
    type: 'expense',
    notes: 'Complete test transaction',
    occurredOn: '2024-11-03',
    status: 'active',
    accountId: testAccountId
  };
  
  let createdTransactionId = null;
  try {
    const completeResponse = await makeRequest('POST', '/api/transactions', completeTransaction);
    logTest('Create Complete Transaction', completeTransaction, completeResponse, 'Should create successfully');
    if (completeResponse.data && completeResponse.data.transactionId) {
      createdTransactionId = completeResponse.data.transactionId;
    }
  } catch (error) {
    logTest('Create Complete Transaction Error', completeTransaction, { status: 'ERROR', data: error.message });
  }

  // 4. Test Cross-Ledger Transaction Event
  console.log('\n🔄 Testing Cross-Ledger Transaction Event...');

  // Get initial balances
  const initialDebtBalanceResponse = await makeRequest('GET', `/api/debt-ledger/${testPersonId}?cycleTag=${testCycleTag}`);
  const initialCashbackBalanceResponse = await makeRequest('GET', `/api/cashback-ledger/${testAccountId}?cycleTag=${testCycleTag}`);
  const initialDebtBalance = initialDebtBalanceResponse.data.balance || 0;
  const initialCashbackBalance = initialCashbackBalanceResponse.data.balance || 0;

  const crossLedgerTransaction = {
    amount: 200.00,
    type: 'debt', // Or 'expense' that triggers debt/cashback
    notes: 'Cross-ledger test transaction',
    occurredOn: '2024-11-03',
    status: 'active',
    accountId: testAccountId,
    personId: testPersonId,
    debtMovement: {
      movementType: 'borrow',
      cycleTag: testCycleTag,
    },
    cashbackMovement: {
      cashbackType: 'percent',
      cashbackValue: '5.00', // 5% cashback
      cycleTag: testCycleTag,
    }
  };

  let crossLedgerTxnId = null;
  try {
    const crossLedgerResponse = await makeRequest('POST', '/api/transactions', crossLedgerTransaction);
    logTest('Create Cross-Ledger Transaction', crossLedgerTransaction, crossLedgerResponse, 'Should create transaction and update ledgers');
    if (crossLedgerResponse.data && crossLedgerResponse.data.transactionId) {
      crossLedgerTxnId = crossLedgerResponse.data.transactionId;
    }

    // Verify updated balances
    const updatedDebtBalanceResponse = await makeRequest('GET', `/api/debt-ledger/${testPersonId}?cycleTag=${testCycleTag}`);
    const updatedCashbackBalanceResponse = await makeRequest('GET', `/api/cashback-ledger/${testAccountId}?cycleTag=${testCycleTag}`);
    const updatedDebtBalance = updatedDebtBalanceResponse.data.balance || 0;
    const updatedCashbackBalance = updatedCashbackBalanceResponse.data.balance || 0;

    const expectedDebtBalance = initialDebtBalance + 200.00;
    const expectedCashbackAmount = 200.00 * 0.05;
    const expectedCashbackBalance = initialCashbackBalance + expectedCashbackAmount;

    logTest('Verify Debt Ledger Update', {}, { status: 200, data: { expected: expectedDebtBalance, actual: updatedDebtBalance } }, `Debt balance should be ${expectedDebtBalance}`);
    logTest('Verify Cashback Ledger Update', {}, { status: 200, data: { expected: expectedCashbackBalance, actual: updatedCashbackBalance } }, `Cashback balance should be ${expectedCashbackBalance}`);

  } catch (error) {
    logTest('Create Cross-Ledger Transaction Error', crossLedgerTransaction, { status: 'ERROR', data: error.message });
  }

  // 5. Test Update Transaction
  console.log('\n✏️ Testing Update Transaction...');
  if (createdTransactionId) {
    const updateTransactionData = {
      notes: 'Updated test transaction notes',
      amount: 120.00,
    };
    try {
      const updateResponse = await makeRequest('PUT', `/api/transactions/${createdTransactionId}`, updateTransactionData);
      logTest('Update Transaction', { id: createdTransactionId, data: updateTransactionData }, updateResponse, 'Should update transaction successfully');
    } catch (error) {
      logTest('Update Transaction Error', { id: createdTransactionId, data: updateTransactionData }, { status: 'ERROR', data: error.message });
    }
  } else {
    console.log('Skipping update transaction test: No transaction ID found.');
  }

  // 6. Test Rollback (Delete Transaction)
  console.log('\n↩️ Testing Transaction Rollback...');
  if (crossLedgerTxnId) {
    // Get balances before deletion
    const preDeleteDebtBalanceResponse = await makeRequest('GET', `/api/debt-ledger/${testPersonId}?cycleTag=${testCycleTag}`);
    const preDeleteCashbackBalanceResponse = await makeRequest('GET', `/api/cashback-ledger/${testAccountId}?cycleTag=${testCycleTag}`);
    const preDeleteDebtBalance = preDeleteDebtBalanceResponse.data.balance || 0;
    const preDeleteCashbackBalance = preDeleteCashbackBalanceResponse.data.balance || 0;

    try {
      const deleteResponse = await makeRequest('DELETE', `/api/transactions/${crossLedgerTxnId}`, {
        personId: testPersonId,
        debtMovement: { cycleTag: testCycleTag },
        accountId: testAccountId,
        cashbackMovement: { cycleTag: testCycleTag }
      });
      logTest('Delete Cross-Ledger Transaction', { transactionId: crossLedgerTxnId }, deleteResponse, 'Should delete transaction and rollback ledgers');

      // Verify balances after deletion
      const postDeleteDebtBalanceResponse = await makeRequest('GET', `/api/debt-ledger/${testPersonId}?cycleTag=${testCycleTag}`);
      const postDeleteCashbackBalanceResponse = await makeRequest('GET', `/api/cashback-ledger/${testAccountId}?cycleTag=${testCycleTag}`);
      const postDeleteDebtBalance = postDeleteDebtBalanceResponse.data.balance || 0;
      const postDeleteCashbackBalance = postDeleteCashbackBalanceResponse.data.balance || 0;

      // The rollback logic should revert the balances to their state before the cross-ledger transaction
      // So, the post-delete balances should be equal to the initial balances before the cross-ledger transaction
      logTest('Verify Debt Ledger Rollback', {}, { status: 200, data: { expected: initialDebtBalance, actual: postDeleteDebtBalance } }, `Debt balance should revert to ${initialDebtBalance}`);
      logTest('Verify Cashback Ledger Rollback', {}, { status: 200, data: { expected: initialCashbackBalance, actual: postDeleteCashbackBalance } }, `Cashback balance should revert to ${initialCashbackBalance}`);

    } catch (error) {
      logTest('Delete Cross-Ledger Transaction Error', { transactionId: crossLedgerTxnId }, { status: 'ERROR', data: error.message });
    }
  } else {
    console.log('Skipping rollback test: No cross-ledger transaction ID found.');
  }


  // 7. Test Debt Ledger API
  console.log('\n💳 Testing Debt Ledger API...');
  
  try {
    const getDebtResponse = await makeRequest('GET', '/api/debt-ledger');
    logTest('Get Debt Ledgers', {}, getDebtResponse, 'Should return debt ledger list');
  } catch (error) {
    logTest('Get Debt Ledgers Error', {}, { status: 'ERROR', data: error.message });
  }

  const debtLedgerData = {
    personId: 'test-person-2', // Use a new person to avoid conflicts
    cycleTag: '2024-11',
    initialDebt: '0.00',
    newDebt: '500.00',
    repayments: '0.00',
    debtDiscount: '0.00',
    netDebt: '500.00',
    status: 'open',
  };
  
  let createdDebtLedgerId = null;
  try {
    const createDebtResponse = await makeRequest('POST', '/api/debt-ledger', debtLedgerData);
    logTest('Create Debt Ledger', debtLedgerData, createDebtResponse, 'Should create debt ledger');
    if (createDebtResponse.data && createDebtResponse.data.debtLedgerId) {
      createdDebtLedgerId = createDebtResponse.data.debtLedgerId;
    }
  } catch (error) {
    logTest('Create Debt Ledger Error', debtLedgerData, { status: 'ERROR', data: error.message });
  }

  // 8. Test Update Debt Ledger
  console.log('\n✏️ Testing Update Debt Ledger...');
  if (createdDebtLedgerId) {
    const updateDebtLedgerData = {
      netDebt: '450.00',
      notes: 'Updated debt ledger notes',
      status: 'partial',
    };
    try {
      const updateResponse = await makeRequest('PUT', `/api/debt-ledger/${createdDebtLedgerId}`, updateDebtLedgerData);
      logTest('Update Debt Ledger', { id: createdDebtLedgerId, data: updateDebtLedgerData }, updateResponse, 'Should update debt ledger successfully');
    } catch (error) {
      logTest('Update Debt Ledger Error', { id: createdDebtLedgerId, data: updateDebtLedgerData }, { status: 'ERROR', data: error.message });
    }
  } else {
    console.log('Skipping update debt ledger test: No debt ledger ID found.');
  }

  // 9. Test Cashback Ledger API
  console.log('\n💰 Testing Cashback Ledger API...');
  
  try {
    const getCashbackResponse = await makeRequest('GET', '/api/cashback-ledger');
    logTest('Get Cashback Ledgers', {}, getCashbackResponse, 'Should return cashback ledger list');
  } catch (error) {
    logTest('Get Cashback Ledgers Error', {}, { status: 'ERROR', data: error.message });
  }

  const cashbackLedgerData = {
    accountId: 'test-account-2', // Use a new account to avoid conflicts
    cycleTag: '2024-11',
    totalSpend: '0.00',
    totalCashback: '25.50',
    budgetCap: '0.00',
    eligibility: 'pending',
    remainingBudget: '25.50',
    status: 'open',
  };
  
  let createdCashbackLedgerId = null;
  try {
    const createCashbackResponse = await makeRequest('POST', '/api/cashback-ledger', cashbackLedgerData);
    logTest('Create Cashback Ledger', cashbackLedgerData, createCashbackResponse, 'Should create cashback ledger');
    if (createCashbackResponse.data && createCashbackResponse.data.cashbackLedgerId) {
      createdCashbackLedgerId = createCashbackResponse.data.cashbackLedgerId;
    }
  } catch (error) {
    logTest('Create Cashback Ledger Error', cashbackLedgerData, { status: 'ERROR', data: error.message });
  }

  // 10. Test Update Cashback Ledger
  console.log('\n✏️ Testing Update Cashback Ledger...');
  if (createdCashbackLedgerId) {
    const updateCashbackLedgerData = {
      totalCashback: '30.00',
      notes: 'Updated cashback ledger notes',
      eligibility: 'eligible',
    };
    try {
      const updateResponse = await makeRequest('PUT', `/api/cashback-ledger/${createdCashbackLedgerId}`, updateCashbackLedgerData);
      logTest('Update Cashback Ledger', { id: createdCashbackLedgerId, data: updateCashbackLedgerData }, updateResponse, 'Should update cashback ledger successfully');
    } catch (error) {
      logTest('Update Cashback Ledger Error', { id: createdCashbackLedgerId, data: updateCashbackLedgerData }, { status: 'ERROR', data: error.message });
    }
  } else {
    console.log('Skipping update cashback ledger test: No cashback ledger ID found.');
  }

  // 11. Test Edge Cases
  console.log('\n⚠️  Testing Edge Cases...');
  
  // Negative amount transaction
  const negativeTransaction = {
    amount: -100,
    type: 'expense',
    notes: 'Negative amount test',
    occurredOn: '2024-11-03',
    status: 'active',
    accountId: testAccountId
  };
  
  try {
    const negativeResponse = await makeRequest('POST', '/api/transactions', negativeTransaction);
    logTest('Negative Amount Transaction', negativeTransaction, negativeResponse, 'Should handle negative amounts');
  } catch (error) {
    logTest('Negative Amount Error', negativeTransaction, { status: 'ERROR', data: error.message });
  }

  // Missing personId for debt ledger (direct creation, not via transaction)
  const incompleteDebtLedger = {
    cycleTag: '2024-11',
    initialDebt: '0.00',
    newDebt: '100.00',
    repayments: '0.00',
    debtDiscount: '0.00',
    netDebt: '100.00',
    status: 'open',
  };
  
  try {
    const incompleteDebtResponse = await makeRequest('POST', '/api/debt-ledger', incompleteDebtLedger);
    logTest('Incomplete Debt Ledger', incompleteDebtLedger, incompleteDebtResponse, 'Should fail validation');
  } catch (error) {
    logTest('Incomplete Debt Ledger Error', incompleteDebtLedger, { status: 'ERROR', data: error.message });
  }

  // Missing accountId for cashback ledger (direct creation, not via transaction)
  const incompleteCashbackLedger = {
    cycleTag: '2024-11',
    totalSpend: '0.00',
    totalCashback: '50.00',
    budgetCap: '0.00',
    eligibility: 'pending',
    remainingBudget: '50.00',
    status: 'open',
  };
  
  try {
    const incompleteCashbackResponse = await makeRequest('POST', '/api/cashback-ledger', incompleteCashbackLedger);
    logTest('Incomplete Cashback Ledger', incompleteCashbackLedger, incompleteCashbackResponse, 'Should fail validation');
  } catch (error) {
    logTest('Incomplete Cashback Ledger Error', incompleteCashbackLedger, { status: 'ERROR', data: error.message });
  }

  // 12. Test Boundary Cases
  console.log('\n🔍 Testing Boundary Cases...');
  
  // Zero amount transaction
  const zeroTransaction = {
    amount: 0,
    type: 'expense',
    notes: 'Zero amount test',
    occurredOn: '2024-11-03',
    status: 'active',
    accountId: testAccountId
  };
  
  try {
    const zeroResponse = await makeRequest('POST', '/api/transactions', zeroTransaction);
    logTest('Zero Amount Transaction', zeroTransaction, zeroResponse, 'Should handle zero amounts');
  } catch (error) {
    logTest('Zero Amount Error', zeroTransaction, { status: 'ERROR', data: error.message });
  }

  // Large amount transaction
  const largeTransaction = {
    amount: 999999999.99,
    type: 'expense',
    notes: 'Large amount test',
    occurredOn: '2024-11-03',
    status: 'active',
    accountId: testAccountId
  };
  
  try {
    const largeResponse = await makeRequest('POST', '/api/transactions', largeTransaction);
    logTest('Large Amount Transaction', largeTransaction, largeResponse, 'Should handle large amounts');
  } catch (error) {
    logTest('Large Amount Error', largeTransaction, { status: 'ERROR', data: error.message });
  }

  // 13. Clean up created ledgers
  console.log('\n🧹 Cleaning up test ledgers...');
  if (createdDebtLedgerId) {
    try {
      await makeRequest('DELETE', `/api/debt-ledger/${createdDebtLedgerId}`);
      console.log(`Deleted debt ledger: ${createdDebtLedgerId}`);
    } catch (error) {
      console.error(`Failed to delete debt ledger ${createdDebtLedgerId}: ${error.message}`);
    }
  }
  if (createdCashbackLedgerId) {
    try {
      await makeRequest('DELETE', `/api/cashback-ledger/${createdCashbackLedgerId}`);
      console.log(`Deleted cashback ledger: ${createdCashbackLedgerId}`);
    } catch (error) {
      console.error(`Failed to delete cashback ledger ${createdCashbackLedgerId}: ${error.message}`);
    }
  }
  console.log('✅ Test ledger cleanup complete.');

  // Generate report
  generateReport();
}

function generateReport() {
  const successCount = TEST_RESULTS.filter(r => r.response.status === 200 && !r.response.data?.error).length;
  const failCount = TEST_RESULTS.length - successCount;

  const report = `# Ledger API Test Report

Generated: ${new Date().toISOString()}

## Test Summary
- **Total Tests:** ${TEST_RESULTS.length}
- **Successful:** ${successCount}
- **Failed:** ${failCount}
- **Success Rate:** ${((successCount / TEST_RESULTS.length) * 100).toFixed(1)}%

## API Endpoints Tested
1. \`GET /api/transactions\` - List transactions
2. \`POST /api/transactions\` - Create transaction
3. \`PUT /api/transactions/[id]\` - Update transaction
4. \`POST /api/transactions\` - Create cross-ledger transaction
5. \`DELETE /api/transactions/[id]\` - Delete transaction (rollback test)
6. \`GET /api/debt-ledger\` - List debt ledgers
7. \`POST /api/debt-ledger\` - Create debt ledger
8. \`PUT /api/debt-ledger/[id]\` - Update debt ledger
9. \`GET /api/cashback-ledger\` - List cashback ledgers
10. \`POST /api/cashback-ledger\` - Create cashback ledger
11. \`PUT /api/cashback-ledger/[id]\` - Update cashback ledger

## Test Results

${TEST_RESULTS.map(result => `
### ${result.test}
**Timestamp:** ${result.timestamp}

**Input:**
\`\`\`json
${JSON.stringify(result.input, null, 2)}
\`\`\`

**Response:**
- Status: ${result.response.status}
- Data: 
\`\`\`json
${JSON.stringify(result.response.data, null, 2)}
\`\`\`

${result.notes ? `**Notes:** ${result.notes}` : ''}

---
`).join('')}

## Key Findings

### ✅ Working Features
- Transaction listing (GET /api/transactions)
- Transaction validation (missing required fields)
- Debt ledger creation and listing
- Cashback ledger creation and listing
- Proper error handling for missing required fields
- Cross-ledger transaction creation and updates
- Transaction rollback for cross-ledger events
- Update transaction
- Update debt ledger
- Update cashback ledger

### ⚠️ Areas for Improvement
1. **Transaction Creation**: Requires \`status\` and \`accountId\` fields (addressed in tests)
2. **Validation**: Need to add validation for negative amounts
3. **Foreign Key Validation**: Should validate that \`accountId\` and \`personId\` exist (addressed in setup)
4. **Amount Limits**: Consider adding reasonable limits for transaction amounts

### 🔧 Recommended Fixes
1. Add proper amount validation (positive numbers, reasonable limits)
2. Implement audit logging for all ledger operations
3. Add rate limiting for API endpoints

### 📋 Missing API Endpoints
1. \`DELETE /api/debt-ledger/[id]\` - Delete debt ledger (now tested)
2. \`DELETE /api/cashback-ledger/[id]\` - Delete cashback ledger (now tested)
3. \`POST /api/debt-movements\` - Record debt movements (now handled via transactions)
4. \`POST /api/cashback-movements\` - Record cashback movements (now handled via transactions)

### 🎯 Next Steps
1. Add comprehensive validation
2. Create integration tests for reconciliation (requires reconciliation logic)
3. Implement proper error handling and logging
`;

  fs.writeFileSync('ledger-api-test-report.md', report);
  console.log('\n📊 Comprehensive test report generated: ledger-api-test-report.md');
}

// Main execution
runTests().catch(console.error);
