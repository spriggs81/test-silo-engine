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
import { battleRoyale } from "@flowrdesk/test-silo-engine";

// Run all three engines head-to-head
// Default: 1,000,000 logs per engine
battleRoyale();
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
import { battleRoyale } from "@flowrdesk/test-silo-engine";

battleRoyale(); // 1,000,000 logs (default)
battleRoyale(10_000_000); // 10M logs
```

---

### `testSilo(logCount?)`

Runs Silo in isolation.

```javascript
import { testSilo } from "@flowrdesk/test-silo-engine";

testSilo(); // 1,000,000 logs (default)
testSilo(1_000_000_000); // 1B logs — allow ~15-28 minutes
```

---

### `testPino(logCount?)`

Runs Pino in isolation.

```javascript
import { testPino } from "@flowrdesk/test-silo-engine";

testPino(); // 1,000,000 logs (default)
testPino(25_000_000); // 25M logs
```

> **Note:** Pino requires significant heap at scale. Use `--max-old-space-size=12288` for runs above 10M logs.

---

### `testWinston(logCount?)`

Runs Winston in isolation.

```javascript
import { testWinston } from "@flowrdesk/test-silo-engine";

testWinston(); // 1,000,000 logs (default)
testWinston(25_000_000); // 25M logs
```

> **Note:** Winston is significantly slower than Silo and Pino. A 25M log run takes approximately 8 minutes.

---

## Example: Run All Four Tests

```javascript
import {
  battleRoyale,
  testSilo,
  testPino,
  testWinston,
} from "@flowrdesk/test-silo-engine";

const LOG_COUNT = 10_000_000;

console.log("--- BATTLE ROYALE ---");
await battleRoyale(LOG_COUNT);

console.log("--- SILO SOLO ---");
await testSilo(LOG_COUNT);

console.log("--- PINO SOLO ---");
await testPino(LOG_COUNT);

console.log("--- WINSTON SOLO ---");
await testWinston(LOG_COUNT);
```

---

## What Gets Measured

### The Battle Royale test reports:

| Metric       | Description                                   |
| ------------ | --------------------------------------------- |
| `lps - avg`  | The average logs per seconds over 5 runs      |
| `best`       | The best logs per second out of 5 Runs        |
| `worst`      | The worst Logs per second out of 5 Runs       |
| `Mem - avg`  | The average memory used over 5 runs           |
| `Total Time` | The total time it took to complete all 5 runs |

### The isolation test reports:

| Metric | Description                            |
| ------ | -------------------------------------- |
| `time` | Total elapsed time in seconds          |
| `lps`  | Logs per second — throughput           |
| `cpu`  | CPU usage during the run               |
| `mem`  | Heap growth in MB from start to finish |

All measurements use `process.hrtime.bigint()` for timing and `process.memoryUsage().heapUsed` for memory. GC is forced before each run when `--expose-gc` is available.

---

## Published Benchmark Results

Results from our reference hardware. Your numbers will vary based on CPU, disk speed, and available RAM.

### Battle Royale — 100,000 Logs

| Engine   | LPS - Avg   | Best        | Worst       | Avg Memory   | Total Time |
| -------- | ----------- | ----------- | ----------- | ------------ | ---------- |
| **Silo** | **506,538** | **606,405** | **296,617** | **86.80 MB** | 1.20 secs  |
| Pino     | 176,145     | 235,772     | 143,143     | 69.17 MB     | 3.06 secs  |
| Winston  | 71,443      | 73,157      | 69,766      | 22.83 MB     | 7.10 secs  |

### Battle Royale — 1,000,000 Logs

| Engine   | LPS - Avg   | Best        | Worst       | Avg Memory    | Total Time |
| -------- | ----------- | ----------- | ----------- | ------------- | ---------- |
| **Silo** | **457,754** | **585,949** | **377,351** | **317.86 MB** | 11.33 secs |
| Pino     | 150,843     | 166,224     | 144,342     | 215.08 MB     | 33.68 secs |
| Winston  | 75,505      | 78,067      | 73,560      | 137.74 MB     | 66.44 secs |

### Battle Royale — 10,000,000 Logs

| Engine   | LPS - Avg   | Best        | Worst       | Avg Memory      | Total Time  |
| -------- | ----------- | ----------- | ----------- | --------------- | ----------- |
| **Silo** | **403,827** | **411,095** | **395,535** | **308.89 MB**   | 123.91 secs |
| Pino     | 143,928     | 148,514     | 141,799     | 1,696.81 MB     | 350.51 secs |
| Winston  | 80,044      | 80,864      | 79,468      | 1,301.36 MB     | 625.37 secs |

### Battle Royale — 25,000,000 Logs

| Engine   | LPS - Avg   | Best        | Worst       | Avg Memory      | Total Time    |
| -------- | ----------- | ----------- | ----------- | --------------- | ------------- |
| **Silo** | **420,836** | **445,849** | **393,658** | **296.18 MB**   | 297.77 secs   |
| Pino     | 117,573     | 126,362     | 94,856      | 3,937.00 MB     | 1,091.88 secs |
| Winston  | 54,294      | 64,584      | 40,603      | 3,244.94 MB     | 2,376.68 secs |

> Silo 100M and 1B results are available in the [@flowrdesk/silo](https://www.npmjs.com/package/@flowrdesk/silo) package benchmarks.

---

## Log Files

Each engine writes to its own folder during testing:

- Silo → `tests_silo/`
- Pino → `tests_pino/`
- Winston → `tests_winston/`

These folders are safe to delete after testing.

---

## Part of the Silo Series

This package is maintained by [Flowrdesk LLC](https://flowrdesk.com) as part of the Silo Series ecosystem.

| Package                                                            | Description             |
| ------------------------------------------------------------------ | ----------------------- |
| [`@flowrdesk/silo`](https://www.npmjs.com/package/@flowrdesk/silo) | The core logging engine |
| `@flowrdesk/test-silo-engine`                                      | This benchmark suite    |

---

## License

Apache-2.0 — see [LICENSE](./LICENSE) for full text.  
Copyright 2026 John Spriggs (Flowrdesk LLC)
