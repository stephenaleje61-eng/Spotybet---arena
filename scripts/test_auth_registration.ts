import http from 'http';
import { handler as netlifyHandler } from '../netlify/functions/api.js';

const BASE_URL = 'http://localhost:3000';

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: any;
  raw: string;
}

function makeRequest(
  method: string,
  path: string,
  data?: any,
  token?: string
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = data ? JSON.stringify(data) : '';

    const headers: Record<string, string | number> = {
      'Content-Type': 'application/json',
      'x-load-test-bypass': 'ARENA_INTERNAL_BENCHMARK',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed: any = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: parsed,
            raw,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    failed++;
  }
}

async function runAuthTests() {
  console.log('\n======================================================');
  console.log('🧪 SAFE PICKS ARENA — COMPREHENSIVE REGISTRATION & AUTH TEST SUITE');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const testEmail = `arena_user_${timestamp}@example.com`;
  const testUsername = `striker_${timestamp.toString().slice(-6)}`;
  const testPassword = 'ArenaSecurePassword2026!';

  // TEST 1: Register brand new account
  console.log('▶ Test 1: Register a new account');
  const regRes = await makeRequest('POST', '/api/auth/register', {
    email: testEmail,
    username: testUsername,
    password: testPassword,
    favoriteTeam: 'Real Madrid',
    favoriteBookmaker: 'SportyBet',
  });
  assert(regRes.status === 201, `Status is 201 Created (got ${regRes.status})`);
  assert(!!regRes.body?.user, 'User object returned');
  assert(regRes.body?.user?.email === testEmail.toLowerCase(), 'Email matches normalized email');
  assert(regRes.body?.user?.username === testUsername, 'Username matches');
  assert(regRes.body?.user?.passwordHash === undefined, 'passwordHash is not exposed in response');
  assert(!!regRes.body?.token, 'Session token is returned');
  assert(!!regRes.body?.verificationCode, 'Verification code is returned');
  const userToken = regRes.body?.token;
  const verificationCode = regRes.body?.verificationCode;

  // TEST 2: Attempt duplicate email registration
  console.log('\n▶ Test 2: Duplicate email registration check');
  const dupEmailRes = await makeRequest('POST', '/api/auth/register', {
    email: testEmail,
    username: `other_${timestamp.toString().slice(-6)}`,
    password: 'DifferentPassword123!',
  });
  assert(dupEmailRes.status === 400, `Status is 400 Bad Request (got ${dupEmailRes.status})`);
  assert(
    dupEmailRes.body?.error === 'An account with this email already exists',
    `Correct duplicate email message: "${dupEmailRes.body?.error}"`
  );

  // TEST 3: Attempt duplicate username registration
  console.log('\n▶ Test 3: Duplicate username registration check');
  const dupUserRes = await makeRequest('POST', '/api/auth/register', {
    email: `unique_${timestamp}@example.com`,
    username: testUsername,
    password: 'DifferentPassword123!',
  });
  assert(dupUserRes.status === 400, `Status is 400 Bad Request (got ${dupUserRes.status})`);
  assert(
    dupUserRes.body?.error === 'This username is already taken',
    `Correct duplicate username message: "${dupUserRes.body?.error}"`
  );

  // TEST 4: Invalid email format
  console.log('\n▶ Test 4: Invalid email format');
  const invEmailRes = await makeRequest('POST', '/api/auth/register', {
    email: 'not-an-email',
    username: `valid_user_${timestamp}`,
    password: 'ValidPassword123!',
  });
  assert(invEmailRes.status === 400, `Status is 400 Bad Request (got ${invEmailRes.status})`);
  assert(
    invEmailRes.body?.error === 'Please enter a valid email address',
    `Correct invalid email error: "${invEmailRes.body?.error}"`
  );

  // TEST 5: Password too short (< 6 chars)
  console.log('\n▶ Test 5: Short password check');
  const shortPassRes = await makeRequest('POST', '/api/auth/register', {
    email: `shortpass_${timestamp}@example.com`,
    username: `short_user_${timestamp}`,
    password: '123',
  });
  assert(shortPassRes.status === 400, `Status is 400 Bad Request (got ${shortPassRes.status})`);
  assert(
    shortPassRes.body?.error === 'Password must be at least 6 characters long',
    `Correct short password message: "${shortPassRes.body?.error}"`
  );

  // TEST 6: Username too short (< 3 chars)
  console.log('\n▶ Test 6: Short username check');
  const shortUserRes = await makeRequest('POST', '/api/auth/register', {
    email: `shortname_${timestamp}@example.com`,
    username: 'ab',
    password: 'ValidPassword123!',
  });
  assert(shortUserRes.status === 400, `Status is 400 Bad Request (got ${shortUserRes.status})`);
  assert(
    shortUserRes.body?.error === 'Username must be between 3 and 25 characters long',
    `Correct short username message: "${shortUserRes.body?.error}"`
  );

  // TEST 7: Verify email with received code
  console.log('\n▶ Test 7: Email verification');
  const verifyRes = await makeRequest(
    'POST',
    '/api/auth/verify-email',
    { code: verificationCode },
    userToken
  );
  assert(verifyRes.status === 200, `Status is 200 OK (got ${verifyRes.status})`);
  assert(verifyRes.body?.user?.isVerified === true, 'User isVerified is now true');

  // TEST 8: Log in with newly registered account (using email)
  console.log('\n▶ Test 8: Login with email and password');
  const loginEmailRes = await makeRequest('POST', '/api/auth/login', {
    emailOrUsername: testEmail,
    password: testPassword,
  });
  assert(loginEmailRes.status === 200, `Status is 200 OK (got ${loginEmailRes.status})`);
  assert(loginEmailRes.body?.user?.email === testEmail.toLowerCase(), 'Logged in user email matches');
  assert(!!loginEmailRes.body?.token, 'Login returned valid token');

  // TEST 9: Log in with newly registered account (using username)
  console.log('\n▶ Test 9: Login with username and password');
  const loginUserRes = await makeRequest('POST', '/api/auth/login', {
    emailOrUsername: testUsername,
    password: testPassword,
  });
  assert(loginUserRes.status === 200, `Status is 200 OK (got ${loginUserRes.status})`);
  assert(loginUserRes.body?.user?.username === testUsername, 'Logged in username matches');

  // TEST 10: Login with wrong password
  console.log('\n▶ Test 10: Login with incorrect password');
  const wrongPassRes = await makeRequest('POST', '/api/auth/login', {
    emailOrUsername: testEmail,
    password: 'WrongPassword!',
  });
  assert(wrongPassRes.status === 401, `Status is 401 Unauthorized (got ${wrongPassRes.status})`);

  // TEST 11: Get current authenticated user profile
  console.log('\n▶ Test 11: Fetch authenticated user (/api/auth/me)');
  const meRes = await makeRequest('GET', '/api/auth/me', null, userToken);
  assert(meRes.status === 200, `Status is 200 OK (got ${meRes.status})`);
  assert(meRes.body?.user?.username === testUsername, 'Profile matches created user');

  // TEST 12: Test Netlify function handler directly
  console.log('\n▶ Test 12: Netlify serverless handler execution');
  const netlifyEvent = {
    httpMethod: 'POST',
    path: '/api/auth/register',
    headers: {
      'content-type': 'application/json',
      'x-load-test-bypass': 'ARENA_INTERNAL_BENCHMARK',
    },
    body: JSON.stringify({
      email: `netlify_${timestamp}@example.com`,
      username: `netl_${timestamp.toString().slice(-6)}`,
      password: 'NetlifyTestPass123!',
    }),
  };
  const netlifyResponse: any = await netlifyHandler(netlifyEvent, {} as any);
  assert(
    netlifyResponse.statusCode === 201,
    `Netlify function returns 201 Created (got ${netlifyResponse.statusCode})`
  );
  const netlifyBody = JSON.parse(netlifyResponse.body);
  assert(netlifyBody.user?.email === `netlify_${timestamp}@example.com`, 'Netlify user registered correctly');

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
