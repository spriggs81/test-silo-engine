/**
 * Copyright 2026 John Spriggs (Flowrdesk LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// ============================================================
//  SILO vs PINO vs WINSTON — Fair Benchmark
//  Run with: node --expose-gc benchmark.mjs
// ============================================================

import Logs, {configuration} from '@flowrdesk/silo';
import pino from 'pino';
import winston from 'winston';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

// const Logs = jlogs.Logs

const RUNS = 5;
const LOG_MSG = { msg: "Benchmark test log entry", val: 0.123456789 }; // Fixed value — no Math.random() skew

// ── Helpers ─────────────────────────────────────────────────

function forceGC() {
    if (global.gc) {
        global.gc();
        global.gc(); // Double-tap for thoroughness
    } else {
        console.warn('⚠️  GC not exposed. Run with --expose-gc for clean memory readings.');
    }
}

function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function min(arr) { return Math.min(...arr); }
function max(arr) { return Math.max(...arr); }

function printResults(name, lpsArr, memArr) {
    const avgLps = Math.floor(avg(lpsArr));
    const memAvg = avg(memArr).toFixed(2);
    console.log(`\n🏆  ${name}`);
    console.log(`    LPS  — avg: ${avgLps.toLocaleString()}  |  best: ${Math.floor(max(lpsArr)).toLocaleString()}  |  worst: ${Math.floor(min(lpsArr)).toLocaleString()}`);
    console.log(`    Mem  — avg: +${memAvg} MB  (across ${RUNS} runs)`);
}

// ── Engine Runners ───────────────────────────────────────────

async function runSilo(targetLogs) {
    configuration({setDir:('tests_silo')})
    const TARGET_LOGS = targetLogs
    const lpsArr = [], memArr = [];

    for (let r = 0; r < RUNS; r++) {
        forceGC();
        const logger = new Logs({ filename: `battle_test_silo_r${r}`, toFile: true, toTerminal: false });
        const memInit = process.memoryUsage().heapUsed;
        const start = performance.now();

        for (let i = 0; i < TARGET_LOGS; i++) {
            await logger.file(LOG_MSG);
        }
        await logger.flush();

        const elapsed = (performance.now() - start) / 1000;
        const memDelta = (process.memoryUsage().heapUsed - memInit) / 1024 / 1024;
        lpsArr.push(TARGET_LOGS / elapsed);
        memArr.push(memDelta);
    }

    printResults('SILO ENGINE', lpsArr, memArr);
}

async function runPino(targetLogs) {
    const filePath = path.join(process.cwd(), '/tests_pino')
    mkdir(filePath,  { recursive: true })
    const TARGET_LOGS = targetLogs
    const lpsArr = [], memArr = [];

    for (let r = 0; r < RUNS; r++) {
        forceGC();
        const stream = fs.createWriteStream(path.join(filePath, `battle_test_pino_r${r}.log`));
        const logger = pino(stream);

        const memInit = process.memoryUsage().heapUsed;
        const start = performance.now();

        for (let i = 0; i < TARGET_LOGS; i++) {
            logger.info(LOG_MSG);
        }

        // Wait for the underlying stream to fully drain and close
        await new Promise((resolve, reject) => {
            stream.end(() => resolve());
            stream.on('error', reject);
        });

        const elapsed = (performance.now() - start) / 1000;
        const memDelta = (process.memoryUsage().heapUsed - memInit) / 1024 / 1024;
        lpsArr.push(TARGET_LOGS / elapsed);
        memArr.push(memDelta);
    }

    printResults('PINO (Standard)', lpsArr, memArr);
}

async function runWinston(targetLogs) {
    const filePath = path.join(process.cwd(), '/tests_winston/')
    const TARGET_LOGS = targetLogs;
    const lpsArr = [], memArr = [];

    for (let r = 0; r < RUNS; r++) {
        forceGC();

        const fileTransport = new winston.transports.File({ 
            filename: filePath + `battle_test_winston_r${r}.log` 
        });
        
        const logger = winston.createLogger({ 
            transports: [fileTransport],
            // Prevents the process from crashing on a single write error
            exitOnError: false 
        });

        // Add a dummy error handler to catch "write after end" without crashing the bench
        logger.on('error', () => {}); 
        fileTransport.on('error', () => {});

        const memInit = process.memoryUsage().heapUsed;
        const start = performance.now();

        for (let i = 0; i < TARGET_LOGS; i++) {
            const canWrite = logger.info(LOG_MSG);
            
            // Critical: If the stream is full, wait for it to clear
            if (!canWrite) {
                await new Promise(resolve => fileTransport.once('drain', resolve));
            }
        }

        // The "Bulletproof" Shutdown Sequence
        await new Promise((resolve) => {
            // 1. Wait for the file transport to finish writing
            fileTransport.once('finish', () => {
                logger.close();
                resolve();
            });
            // 2. Trigger the end
            logger.end();
        });

        const elapsed = (performance.now() - start) / 1000;
        const memDelta = (process.memoryUsage().heapUsed - memInit) / 1024 / 1024;
        
        lpsArr.push(TARGET_LOGS / elapsed);
        memArr.push(memDelta);
    }

    printResults('WINSTON (Standard)', lpsArr, memArr);
}
// async function runWinston(targetLogs) {
//     const TARGET_LOGS = targetLogs
//     const lpsArr = [], memArr = [];

//     for (let r = 0; r < RUNS; r++) {
//         forceGC();

//         const fileTransport = new winston.transports.File({ filename: `bench_winston_r${r}.log` });
//         const logger = winston.createLogger({ transports: [fileTransport] });

//         const memInit = process.memoryUsage().heapUsed;
//         const start = performance.now();

//         for (let i = 0; i < TARGET_LOGS; i++) {
//             logger.info(LOG_MSG);
//         }

//         // Wait for Winston's internal stream to drain — no hardcoded sleeps
//         await new Promise((resolve, reject) => {
//             fileTransport.once('finish', resolve);
//             fileTransport.once('error', reject);
//             logger.end();
//         });
//         logger.close()

//         const elapsed = (performance.now() - start) / 1000;
//         const memDelta = (process.memoryUsage().heapUsed - memInit) / 1024 / 1024;
//         lpsArr.push(TARGET_LOGS / elapsed);
//         memArr.push(memDelta);
//     }

//     printResults('WINSTON (Standard)', lpsArr, memArr);
// }

// ── Main ─────────────────────────────────────────────────────

async function runBattle(targetLogs) {
    console.log(`\n🚀  BATTLE ROYALE — SILO vs PINO vs WINSTON`);
    console.log(`    ${targetLogs.toLocaleString()} logs × ${RUNS} runs each`);
    console.log(`    All engines measured to full disk flush completion`);
    console.log(`────────────────────────────────────────────────────`);

    await runSilo(targetLogs);
    await runPino(targetLogs);
    await runWinston(targetLogs);

    console.log(`\n────────────────────────────────────────────────────`);
    console.log(`✅  Done. All temp log files can be deleted safely.\n`);
}

export const battleRoyale = async (targetLogs = 1_000_000) => {
    try {
        await runBattle(targetLogs)
    } catch (err) {
        console.error('Battle Royale failed:', err)
    }
}
