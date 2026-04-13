# @flowrdesk/test-silo-engine

**Independent benchmark suite for the Flowrdesk Silo Series.**  
Test and compare Silo, Pino, and Winston on your own hardware.

[![npm version](https://img.shields.io/npm/v/@flowrdesk/test-silo-engine)](https://www.npmjs.com/package/@flowrdesk/test-silo-engine)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)

---

## Why This Package Exists

We believe benchmark claims should be verifiable. Every number published about the Silo Series was generated using the exact tests in this package — on real hardware, with real disk I/O, with GC forced before every measurement.

Install this package, run the tests on your own machine, and see the results for yourself.

---

## Install

```bash
npm install @flowrdesk/test-silo-engine
```

Pino and Winston are included as dependencies. No additional installs required.

> **Required:** Always run your test file with `node --expose-gc your_file.js` for accurate memory readings.  
> For large log counts (100M+), add `--max-old-space-size=12288` to increase available heap.

---

## Quick Start

```javascript
import { battleRoyale } from '@flowrdesk/test-silo-engine'

// Run all three engines head-to-head
// Default: 1,000,000 logs per engine
battleRoyale()
```

Run it:

```bash
node --expose-gc your_file.js
```

---

## API

### `battleRoyale(logCount?)`

Runs Silo, Pino, and Winston back-to-back under identical conditions. Same log payload, same flush guarantee, GC forced between each engine. Reports LPS, memory, and timing for each.

```javascript
import { battleRoyale } from '@flowrdesk/test-silo-engine'

battleRoyale()              // 1,000,000 logs (default)
battleRoyale(10_000_000)    // 10M logs
```

---

### `testSilo(logCount?)`

Runs Silo in isolation.

```javascript
import { testSilo } from '@flowrdesk/test-silo-engine'

testSilo()                  // 1,000,000 logs (default)
testSilo(1_000_000_000)     // 1B logs — allow ~15-28 minutes
```

---

### `testPino(logCount?)`

Runs Pino in isolation.

```javascript
import { testPino } from '@flowrdesk/test-silo-engine'

testPino()                  // 1,000,000 logs (default)
testPino(25_000_000)        // 25M logs
```

> **Note:** Pino requires significant heap at scale. Use `--max-old-space-size=12288` for runs above 10M logs.

---

### `testWinston(logCount?)`

Runs Winston in isolation.

```javascript
import { testWinston } from '@flowrdesk/test-silo-engine'

testWinston()               // 1,000,000 logs (default)
testWinston(25_000_000)     // 25M logs
```

> **Note:** Winston is significantly slower than Silo and Pino. A 25M log run takes approximately 8 minutes.

---

## Example: Run All Four Tests

```javascript
import { battleRoyale, testSilo, testPino, testWinston } from '@flowrdesk/test-silo-engine'

const LOG_COUNT = 10_000_000

console.log('--- BATTLE ROYALE ---')
await battleRoyale(LOG_COUNT)

console.log('--- SILO SOLO ---')
await testSilo(LOG_COUNT)

console.log('--- PINO SOLO ---')
await testPino(LOG_COUNT)

console.log('--- WINSTON SOLO ---')
await testWinston(LOG_COUNT)
```

---

## What Gets Measured

Every test reports:

| Metric | Description |
|---|---|
| `time` | Total elapsed time in seconds |
| `lps` | Logs per second — throughput |
| `cpu` | CPU usage during the run |
| `mem` | Heap growth in MB from start to finish |

All measurements use `process.hrtime.bigint()` for timing and `process.memoryUsage().heapUsed` for memory. GC is forced before each run when `--expose-gc` is available.

---

## Published Benchmark Results

Results from our reference hardware. Your numbers will vary based on CPU, disk speed, and available RAM.

### Battle Royale — 1,000,000 Logs

| Engine | LPS | Memory |
|---|---|---|
| **Silo** | **560,823** | **100 MB** |
| Pino | 138,265 | 125 MB |
| Winston | 81,087 | 49 MB |

### Individual Engine — 10,000,000 Logs

| Engine | LPS | Memory |
|---|---|---|
| **Silo** | **830,867** | **145 MB** |
| Pino | 135,206 | 1,061 MB |
| Winston | 84,734 | 44 MB |

### Individual Engine — 25,000,000 Logs

| Engine | LPS | Memory | Completes? |
|---|---|---|---|
| **Silo** | **TBD** | **TBD** | ✅ |
| Pino | — | 2,692 MB | ⚠️ Requires 12GB heap |
| Winston | — | — | ⚠️ Est. 8+ minutes |

> Silo 100M and 1B results are available in the [@flowrdesk/silo](https://www.npmjs.com/package/@flowrdesk/silo) package benchmarks.

---

## Log Files

Each engine writes to its own folder during testing:

- Silo → `.logs/`
- Pino → `pino_test/`
- Winston → `winston_test/`

These folders are safe to delete after testing.

---

## Part of the Silo Series

This package is maintained by [Flowrdesk LLC](https://flowrdesk.com) as part of the Silo Series ecosystem.

| Package | Description |
|---|---|
| [`@flowrdesk/silo`](https://www.npmjs.com/package/@flowrdesk/silo) | The core logging engine |
| `@flowrdesk/test-silo-engine` | This benchmark suite |

---

## License

Apache-2.0 — see [LICENSE](./LICENSE) for full text.  
Copyright 2026 John Spriggs (Flowrdesk LLC)
