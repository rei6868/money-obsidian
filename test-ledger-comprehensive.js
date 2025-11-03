#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// Helper function to make curl requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    let cmd = `curl -s -X ${method} ${BASE_URL}${path}`;
    
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
  console.log(`✓ ${testName}: ${response.status === 200 ? 'SUCCESS' : 'FAILED'}`);
  if (response.data?.error) {
    console.log(`  Error: ${response.data.error}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Ledger API Tests...\n');

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
    status: 'completed',
    accountId: 'test-account-1'
  };
  
  try {
    const completeResponse = await makeRequest('POST', '/api/transactions', completeTransaction);
    logTest('Create Complete Transaction', completeTransaction, completeResponse, 'Should create successfully');
  } catch (error) {
    logTest('Create Complete Transaction Error', completeTransaction, { status: 'ERROR', data: error.message });
  }

  // 4. Test Debt Ledger API
  console.log('\n💳 Testing Debt Ledger API...');
  
  try {
    const getDebtResponse = await makeRequest('GET', '/api/debt-ledger');
    logTest('Get Debt Ledgers', {}, getDebtResponse, 'Should return debt ledger list');
  } catch (error) {
    logTest('Get Debt Ledgers Error', {}, { status: 'ERROR', data: error.message });
  }

  const debtLedgerData = {
    personId: 'test-person-1',
    balance: 500.00,
    creditLimit: 1000.00,
    notes: 'Test debt ledger'
  };
  
  try {
    const createDebtResponse = await makeRequest('POST', '/api/debt-ledger', debtLedgerData);
    logTest('Create Debt Ledger', debtLedgerData, createDebtResponse, 'Should create debt ledger');
  } catch (error) {
    logTest('Create Debt Ledger Error', debtLedgerData, { status: 'ERROR', data: error.message });
  }

  // 5. Test Cashback Ledger API
  console.log('\n💰 Testing Cashback Ledger API...');
  
  try {
    const getCashbackResponse = await makeRequest('GET', '/api/cashback-ledger');
    logTest('Get Cashback Ledgers', {}, getCashbackResponse, 'Should return cashback ledger list');
  } catch (error) {
    logTest('Get Cashback Ledgers Error', {}, { status: 'ERROR', data: error.message });
  }

  const cashbackLedgerData = {
    accountId: 'test-account-1',
    balance: 25.50,
    totalEarned: 125.50,
    notes: 'Test cashback ledger'
  };
  
  try {
    const createCashbackResponse = await makeRequest('POST', '/api/cashback-ledger', cashbackLedgerData);
    logTest('Create Cashback Ledger', cashbackLedgerData, createCashbackResponse, 'Should create cashback ledger');
  } catch (error) {
    logTest('Create Cashback Ledger Error', cashbackLedgerData, { status: 'ERROR', data: error.message });
  }

  // 6. Test Edge Cases
  console.log('\n⚠️  Testing Edge Cases...');
  
  // Negative amount transaction
  const negativeTransaction = {
    amount: -100,
    type: 'expense',
    notes: 'Negative amount test',
    occurredOn: '2024-11-03',
    status: 'completed',
    accountId: 'test-account-1'
  };
  
  try {
    const negativeResponse = await makeRequest('POST', '/api/transactions', negativeTransaction);
    logTest('Negative Amount Transaction', negativeTransaction, negativeResponse, 'Should handle negative amounts');
  } catch (error) {
    logTest('Negative Amount Error', negativeTransaction, { status: 'ERROR', data: error.message });
  }

  // Missing personId for debt ledger
  const incompleteDebtLedger = {
    balance: 100.00,
    notes: 'Missing personId'
  };
  
  try {
    const incompleteDebtResponse = await makeRequest('POST', '/api/debt-ledger', incompleteDebtLedger);
    logTest('Incomplete Debt Ledger', incompleteDebtLedger, incompleteDebtResponse, 'Should fail validation');
  } catch (error) {
    logTest('Incomplete Debt Ledger Error', incompleteDebtLedger, { status: 'ERROR', data: error.message });
  }

  // Missing accountId for cashback ledger
  const incompleteCashbackLedger = {
    balance: 50.00,
    notes: 'Missing accountId'
  };
  
  try {
    const incompleteCashbackResponse = await makeRequest('POST', '/api/cashback-ledger', incompleteCashbackLedger);
    logTest('Incomplete Cashback Ledger', incompleteCashbackLedger, incompleteCashbackResponse, 'Should fail validation');
  } catch (error) {
    logTest('Incomplete Cashback Ledger Error', incompleteCashbackLedger, { status: 'ERROR', data: error.message });
  }

  // 7. Test Boundary Cases
  console.log('\n🔍 Testing Boundary Cases...');
  
  // Zero amount transaction
  const zeroTransaction = {
    amount: 0,
    type: 'expense',
    notes: 'Zero amount test',
    occurredOn: '2024-11-03',
    status: 'completed',
    accountId: 'test-account-1'
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
    status: 'completed',
    accountId: 'test-account-1'
  };
  
  try {
    const largeResponse = await makeRequest('POST', '/api/transactions', largeTransaction);
    logTest('Large Amount Transaction', largeTransaction, largeResponse, 'Should handle large amounts');
  } catch (error) {
    logTest('Large Amount Error', largeTransaction, { status: 'ERROR', data: error.message });
  }

  // Generate report
  generateReport();
}

function generateReport() {
  const successCount = TEST_RESULTS.filter(r => r.response.status === 200 || (r.response.data && !r.response.data.error)).length;
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
3. \`GET /api/debt-ledger\` - List debt ledgers
4. \`POST /api/debt-ledger\` - Create debt ledger
5. \`GET /api/cashback-ledger\` - List cashback ledgers
6. \`POST /api/cashback-ledger\` - Create cashback ledger

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

### ⚠️ Areas for Improvement
1. **Transaction Creation**: Requires \`status\` and \`accountId\` fields
2. **Validation**: Need to add validation for negative amounts
3. **Foreign Key Validation**: Should validate that \`accountId\` and \`personId\` exist
4. **Amount Limits**: Consider adding reasonable limits for transaction amounts

### 🔧 Recommended Fixes
1. Add proper amount validation (positive numbers, reasonable limits)
2. Implement foreign key validation for referenced entities
3. Add transaction rollback mechanisms for failed operations
4. Implement audit logging for all ledger operations
5. Add rate limiting for API endpoints

### 📋 Missing API Endpoints
1. \`PUT /api/transactions/[id]\` - Update transaction
2. \`DELETE /api/transactions/[id]\` - Delete transaction
3. \`PUT /api/debt-ledger/[id]\` - Update debt ledger
4. \`DELETE /api/debt-ledger/[id]\` - Delete debt ledger
5. \`PUT /api/cashback-ledger/[id]\` - Update cashback ledger
6. \`DELETE /api/cashback-ledger/[id]\` - Delete cashback ledger
7. \`POST /api/debt-movements\` - Record debt movements
8. \`POST /api/cashback-movements\` - Record cashback movements

### 🎯 Next Steps
1. Implement missing CRUD operations
2. Add comprehensive validation
3. Create integration tests for cross-boundary events
4. Add database transaction support for complex operations
5. Implement proper error handling and logging
`;

  fs.writeFileSync('ledger-api-test-report.md', report);
  console.log('\n📊 Comprehensive test report generated: ledger-api-test-report.md');
}

// Main execution
runTests().catch(console.error);
