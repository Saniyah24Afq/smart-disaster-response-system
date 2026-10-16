const assert = require('node:assert/strict');

async function checkBackend() {
  console.log('Checking RESQ backend...');

  const response = await fetch('http://localhost:5000');

  assert.equal(
    response.status,
    200,
    `Backend returned HTTP ${response.status}`
  );

  const body = await response.text();

  assert.match(
    body,
    /RESQ Backend is running successfully/,
    'Backend response does not contain expected RESQ message'
  );

  console.log('Backend smoke test: PASS');
}

async function checkFrontend() {
  console.log('Checking RESQ frontend...');

  const response = await fetch('http://localhost:3000');

  assert.equal(
    response.status,
    200,
    `Frontend returned HTTP ${response.status}`
  );

  const html = await response.text();

  assert.match(
    html,
    /<div id="root"><\/div>|<div id="root">/,
    'Frontend HTML does not contain React root element'
  );

  console.log('Frontend smoke test: PASS');
}

async function runSmokeTests() {
  try {
    await checkBackend();
    await checkFrontend();

    console.log('');
    console.log('======================================');
    console.log('RESQ SMOKE TESTS PASSED SUCCESSFULLY');
    console.log('======================================');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('======================================');
    console.error('RESQ SMOKE TEST FAILED');
    console.error('======================================');
    console.error(error.message);

    process.exit(1);
  }
}

runSmokeTests();