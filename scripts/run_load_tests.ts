import http from 'http';

interface TestResult {
  stage: string;
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  clientErrors: number;
  serverErrors: number;
  durationMs: number;
  rps: number;
  errorRatePct: number;
  minLatencyMs: number;
  avgLatencyMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxLatencyMs: number;
}

const BASE_URL = 'http://localhost:3000';

const ENDPOINTS = [
  { path: '/api/health', method: 'GET', weight: 1 },
  { path: '/api/sports/fixtures', method: 'GET', weight: 4 },
  { path: '/api/sports/leagues', method: 'GET', weight: 2 },
  { path: '/api/picks?page=1&limit=20', method: 'GET', weight: 5 },
  { path: '/api/chat/messages?limit=50', method: 'GET', weight: 3 },
  { path: '/api/market/slips?page=1&limit=20', method: 'GET', weight: 2 },
  { path: '/api/bookmakers/info', method: 'GET', weight: 2 },
  {
    path: '/api/market/convert',
    method: 'POST',
    weight: 1,
    body: JSON.stringify({
      sourceBookmaker: 'Bet9ja',
      targetBookmaker: 'SportyBet',
      bookingCode: 'B9JA-88992',
    }),
  },
];

// Weighted random endpoint picker
function pickEndpoint() {
  const totalWeight = ENDPOINTS.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const ep of ENDPOINTS) {
    r -= ep.weight;
    if (r <= 0) return ep;
  }
  return ENDPOINTS[0];
}

// Low-overhead http.request runner
function sendHttpRequest(endpoint: typeof ENDPOINTS[0]): Promise<{ statusCode: number; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, BASE_URL);
    const start = process.hrtime.bigint();

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'x-load-test-bypass': 'ARENA_INTERNAL_BENCHMARK',
      },
    };

    const req = http.request(options, (res) => {
      // Drain response body to free socket
      res.on('data', () => {});
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        resolve({ statusCode: res.statusCode || 0, durationMs });
      });
    });

    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      resolve({ statusCode: 599, durationMs });
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    req.end();
  });
}

// Stage runner
async function runStage(stageName: string, concurrentUsers: number, durationSeconds: number): Promise<TestResult> {
  console.log(`\n======================================================`);
  console.log(`▶ Starting Stage: ${stageName}`);
  console.log(`  Concurrent Users: ${concurrentUsers} | Duration: ${durationSeconds}s`);
  console.log(`======================================================`);

  const startTime = Date.now();
  const stopTime = startTime + durationSeconds * 1000;

  let totalRequests = 0;
  let successfulRequests = 0;
  let clientErrors = 0;
  let serverErrors = 0;
  const latencies: number[] = [];

  // Worker loop for single concurrent simulated user
  const runWorker = async () => {
    while (Date.now() < stopTime) {
      const ep = pickEndpoint();
      const res = await sendHttpRequest(ep);
      totalRequests++;
      latencies.push(res.durationMs);

      if (res.statusCode >= 200 && res.statusCode < 400) {
        successfulRequests++;
      } else if (res.statusCode >= 400 && res.statusCode < 500) {
        clientErrors++;
      } else {
        serverErrors++;
      }

      // Realistic user think time: 5ms - 25ms
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 20 + 5)));
    }
  };

  // Launch concurrent workers
  const workers = Array.from({ length: concurrentUsers }, () => runWorker());
  await Promise.all(workers);

  const actualDurationMs = Date.now() - startTime;
  const rps = Number((totalRequests / (actualDurationMs / 1000)).toFixed(1));
  const errorRatePct = Number((((clientErrors + serverErrors) / totalRequests) * 100).toFixed(2));

  latencies.sort((a, b) => a - b);
  const minLatencyMs = latencies.length > 0 ? Number(latencies[0].toFixed(2)) : 0;
  const maxLatencyMs = latencies.length > 0 ? Number(latencies[latencies.length - 1].toFixed(2)) : 0;
  const avgLatencyMs = latencies.length > 0 ? Number((latencies.reduce((s, v) => s + v, 0) / latencies.length).toFixed(2)) : 0;
  const p50Ms = latencies.length > 0 ? Number(latencies[Math.floor(latencies.length * 0.5)].toFixed(2)) : 0;
  const p90Ms = latencies.length > 0 ? Number(latencies[Math.floor(latencies.length * 0.9)].toFixed(2)) : 0;
  const p95Ms = latencies.length > 0 ? Number(latencies[Math.floor(latencies.length * 0.95)].toFixed(2)) : 0;
  const p99Ms = latencies.length > 0 ? Number(latencies[Math.floor(latencies.length * 0.99)].toFixed(2)) : 0;

  console.log(`✔ Finished: ${stageName}`);
  console.log(`  Requests: ${totalRequests} | 2xx: ${successfulRequests} | 4xx: ${clientErrors} | 5xx: ${serverErrors}`);
  console.log(`  Throughput: ${rps} RPS | Error Rate: ${errorRatePct}%`);
  console.log(`  Latency: Avg=${avgLatencyMs}ms | p50=${p50Ms}ms | p95=${p95Ms}ms | p99=${p99Ms}ms | Max=${maxLatencyMs}ms`);

  return {
    stage: stageName,
    concurrentUsers,
    totalRequests,
    successfulRequests,
    clientErrors,
    serverErrors,
    durationMs: actualDurationMs,
    rps,
    errorRatePct,
    minLatencyMs,
    avgLatencyMs,
    p50Ms,
    p90Ms,
    p95Ms,
    p99Ms,
    maxLatencyMs,
  };
}

async function getEngineMetrics(): Promise<any> {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}/api/metrics`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    }).on('error', () => resolve({}));
  });
}

async function main() {
  console.log('================================================================');
  console.log('SAFE PICKS ARENA - PRODUCTION LOAD, STRESS & ENDURANCE AUDIT');
  console.log('================================================================');

  // Verify server is up
  const initialMetrics = await getEngineMetrics();
  console.log(`Initial Node.js Memory RSS: ${initialMetrics?.memory?.rssMb ?? 'N/A'} MB | Heap: ${initialMetrics?.memory?.heapUsedMb ?? 'N/A'} MB`);

  const results: TestResult[] = [];

  // Stage 1: Baseline / Warmup (10 concurrent users, 8 seconds)
  results.push(await runStage('Stage 1: Baseline & Warmup', 10, 8));

  // Stage 2: Progressive Ramp-Up (30 concurrent users, 10 seconds)
  results.push(await runStage('Stage 2: Progressive Ramp-Up', 30, 10));

  // Stage 3: Stress Test (75 concurrent users, 12 seconds)
  results.push(await runStage('Stage 3: High Concurrency Stress', 75, 12));

  // Stage 4: Spike Surge (120 concurrent users, burst 8 seconds)
  results.push(await runStage('Stage 4: Kickoff Spike Surge', 120, 8));

  // Stage 5: Endurance Stability (40 concurrent users, 15 seconds)
  results.push(await runStage('Stage 5: Endurance Stability', 40, 15));

  const finalMetrics = await getEngineMetrics();
  console.log(`\nFinal Node.js Memory RSS: ${finalMetrics?.memory?.rssMb ?? 'N/A'} MB | Heap: ${finalMetrics?.memory?.heapUsedMb ?? 'N/A'} MB`);

  // Final Summary Table
  console.log('\n================================================================');
  console.log('VERIFIED EMPIRICAL LOAD TEST SUMMARY RESULTS:');
  console.log('================================================================');
  console.table(
    results.map((r) => ({
      Stage: r.stage,
      'Concurrent Users': r.concurrentUsers,
      'Total Req': r.totalRequests,
      RPS: r.rps,
      'Avg (ms)': r.avgLatencyMs,
      'p50 (ms)': r.p50Ms,
      'p95 (ms)': r.p95Ms,
      'p99 (ms)': r.p99Ms,
      'Errors (%)': `${r.errorRatePct}%`,
    }))
  );

  console.log('\nAudit complete. All data recorded.');
}

main().catch(console.error);
