#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
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
  console.log(`✓ ${testName}: ${response.status}`);
}

// Test Cases
async function runTests() {
  console.log('🚀 Starting Ledger API Tests...\n');

  // 1. Test Transactions CRUD
  console.log('📝 Testing Transactions API...');
  
  // Create transaction
  const newTransaction = {
    amount: 100.50,
    type: 'expense',
    notes: 'Test transaction',
    occurredOn: '2024-11-03',
    accountId: 'test-account-1',
    categoryId: 'test-category-1'
  };
  
  try {
    const createResponse = await makeRequest('POST', '/api/transactions', newTransaction);
    logTest('Create Transaction', newTransaction, createResponse);
    
    if (createResponse.status === 201 && createResponse.data?.id) {
      const transactionId = createResponse.data.id;
      
      // Read transaction
      const readResponse = await makeRequest('GET', `/api/transactions/${transactionId}`);
      logTest('Read Transaction', { id: transactionId }, readResponse);
      
      // Update transaction
      const updateData = { amount: 150.75, notes: 'Updated test transaction' };
      const updateResponse = await makeRequest('PUT', `/api/transactions/${transactionId}`, updateData);
      logTest('Update Transaction', updateData, updateResponse);
      
      // Delete transaction
      const deleteResponse = await makeRequest('DELETE', `/api/transactions/${transactionId}`);
      logTest('Delete Transaction', { id: transactionId }, deleteResponse);
    }
  } catch (error) {
    logTest('Transaction CRUD Error', newTransaction, { status: 'ERROR', data: error.message });
  }

  // 2. Test Debt Ledger Operations
  console.log('\n💳 Testing Debt Ledger API...');
  
  const debtLedgerData = {
    personId: 'test-person-1',
    balance: 500.00,
    creditLimit: 1000.00,
    notes: 'Test debt ledger'
  };
  
  try {
    // Test debt ledger creation (assuming endpoint exists)
    const debtResponse = await makeRequest('POST', '/api/debt-ledger', debtLedgerData);
    logTest('Create Debt Ledger', debtLedgerData, debtResponse);
  } catch (error) {
    logTest('Debt Ledger Error', debtLedgerData, { status: 'ERROR', data: error.message });
  }

  // 3. Test Cashback Ledger Operations
  console.log('\n💰 Testing Cashback Ledger API...');
  
  const cashbackLedgerData = {
    accountId: 'test-account-1',
    balance: 25.50,
    totalEarned: 125.50,
    notes: 'Test cashback ledger'
  };
  
  try {
    const cashbackResponse = await makeRequest('POST', '/api/cashback-ledger', cashbackLedgerData);
    logTest('Create Cashback Ledger', cashbackLedgerData, cashbackResponse);
  } catch (error) {
    logTest('Cashback Ledger Error', cashbackLedgerData, { status: 'ERROR', data: error.message });
  }

  // 4. Test Edge Cases
  console.log('\n⚠️  Testing Edge Cases...');
  
  // Missing required fields
  const incompleteTransaction = { amount: 50 };
  try {
    const incompleteResponse = await makeRequest('POST', '/api/transactions', incompleteTransaction);
    logTest('Incomplete Transaction', incompleteTransaction, incompleteResponse, 'Should fail validation');
  } catch (error) {
    logTest('Incomplete Transaction Error', incompleteTransaction, { status: 'ERROR', data: error.message });
  }
  
  // Negative amount
  const negativeTransaction = {
    amount: -100,
    type: 'expense',
    notes: 'Negative amount test',
    occurredOn: '2024-11-03'
  };
  
  try {
    const negativeResponse = await makeRequest('POST', '/api/transactions', negativeTransaction);
    logTest('Negative Amount Transaction', negativeTransaction, negativeResponse, 'Should handle negative amounts');
  } catch (error) {
    logTest('Negative Amount Error', negativeTransaction, { status: 'ERROR', data: error.message });
  }

  // 5. Test Cross-boundary Events
  console.log('\n🔄 Testing Cross-boundary Events...');
  
  const complexTransaction = {
    amount: 200.00,
    type: 'expense',
    notes: 'Complex transaction with cashback',
    occurredOn: '2024-11-03',
    accountId: 'test-account-1',
    categoryId: 'test-category-1',
    cashbackRate: 0.02,
    debtPersonId: 'test-person-1'
  };
  
  try {
    const complexResponse = await makeRequest('POST', '/api/transactions', complexTransaction);
    logTest('Complex Transaction', complexTransaction, complexResponse, 'Should trigger multiple ledger updates');
  } catch (error) {
    logTest('Complex Transaction Error', complexTransaction, { status: 'ERROR', data: error.message });
  }

  // Generate report
  generateReport();
}

function generateReport() {
  const report = `# Ledger API Test Report

Generated: ${new Date().toISOString()}

## Test Summary
- Total Tests: ${TEST_RESULTS.length}
- Successful: ${TEST_RESULTS.filter(r => r.response.status < 400).length}
- Failed: ${TEST_RESULTS.filter(r => r.response.status >= 400 || r.response.status === 'ERROR').length}

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

## Recommendations

### API Endpoints to Implement
1. \`POST /api/debt-ledger\` - Create debt ledger entries
2. \`POST /api/cashback-ledger\` - Create cashback ledger entries
3. \`POST /api/debt-movements\` - Record debt movements
4. \`POST /api/cashback-movements\` - Record cashback movements

### Validation Improvements
1. Add proper field validation for required fields
2. Implement amount validation (positive/negative rules)
3. Add foreign key validation for accountId, personId, etc.

### Cross-boundary Event Handling
1. Implement transaction triggers for automatic ledger updates
2. Add rollback mechanisms for failed multi-step operations
3. Create audit trail for complex transactions
`;

  fs.writeFileSync('ledger-api-test-report.md', report);
  console.log('\n📊 Test report generated: ledger-api-test-report.md');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await makeRequest('GET', '/api/transactions');
    return response.status < 500;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server not running. Please start with: npm run dev');
    console.log('📝 Generating mock test report...');
    
    // Generate mock results for documentation
    TEST_RESULTS.push(
      {
        test: 'Server Check',
        timestamp: new Date().toISOString(),
        input: { endpoint: '/api/transactions' },
        response: { status: 'ERROR', data: 'Server not running' },
        notes: 'Start server with npm run dev'
      }
    );
    
    generateReport();
    return;
  }
  
  await runTests();
}

main().catch(console.error);
