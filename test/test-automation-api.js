
const assert = require('assert');
const http = require('http');

const post = (path, data) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
};

const testRunJob = async () => {
  try {
    // Test a valid job
    let res = await post('/api/automation/run-job', { jobName: 'reconcile-balances' });
    assert.strictEqual(res.statusCode, 200, 'Test Case 1 Failed: Valid job');
    assert.strictEqual(res.body.message, 'Job \'reconcile-balances\' executed successfully', 'Test Case 1 Failed: Valid job message');

    // Test an invalid job
    res = await post('/api/automation/run-job', { jobName: 'invalid-job' });
    assert.strictEqual(res.statusCode, 400, 'Test Case 2 Failed: Invalid job');
    assert.strictEqual(res.body.message, 'Invalid job name', 'Test Case 2 Failed: Invalid job message');

    // Test with no job name
    res = await post('/api/automation/run-job', {});
    assert.strictEqual(res.statusCode, 400, 'Test Case 3 Failed: No job name');
    assert.strictEqual(res.body.message, 'Invalid job name', 'Test Case 3 Failed: No job name message');

    console.log('All test cases passed!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testRunJob();
