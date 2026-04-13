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


import pino from 'pino';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const FILE_PATH = path.join(process.cwd(), '/tests_pino/', 'pino_solo_test.log');

const clearMemory = () => {
    if (global.gc) {
        global.gc();
        global.gc(); // just making sure
    } else {
        console.warn("Warming: GC not exposed. Run with --expose-gc for consistent results.");
    }
};

export const testPino = async (LOG_COUNT = 1_000_000) => {
    await mkdir(path.dirname(FILE_PATH), { recursive: true });
    // sync: false is Pino's high-performance mode
    const logger = pino(pino.destination({ dest: FILE_PATH, sync: false }));
    console.log('🧹 GC Clearing Memory')
    clearMemory()

    const startUsage = process.cpuUsage();
    const startMem = process.memoryUsage().heapUsed;
    const startTime = process.hrtime.bigint();

    let timeInSecs = 0;
    let endMem = 0;
    let endUsage = { user: 0, system: 0 };

    try {
        console.log(`🚀 PINO: Executing ${LOG_COUNT.toLocaleString()} logs...`);
        for (let i = 0; i < LOG_COUNT; i++) {
            logger.info({ iteration: (i + 1), msg: "demo test log entry", val: 0.123456789 });
        }
        await new Promise(r => logger.flush(r));
        
        const endTime = process.hrtime.bigint();
        endMem = process.memoryUsage().heapUsed;
        timeInSecs = Number(endTime - startTime) / 1e9;
        endUsage = process.cpuUsage(startUsage);

        console.log(`✅ PINO PASSED`);
        console.table({
            time: timeInSecs.toFixed(4),
            lps: Math.round(LOG_COUNT / timeInSecs).toLocaleString(),
            cpu: (((endUsage.user + endUsage.system) / (timeInSecs * 1000000))).toFixed(2) + '%',
            mem: ((endMem - startMem) / 1024 / 1024).toFixed(2) + ' MB'
        });
    } catch (err) {
        console.error(`❌ PINO FAILED`);console.table({
            Status: "FAILED",
            Time_Elapsed: timeInSecs.toFixed(4) + "s",
            Mem_at_Failure: ((endMem - startMem) / 1024 / 1024).toFixed(2) + " MB",
            CPU_Usage: (((endUsage.user + endUsage.system) / (timeInSecs * 1000000)) * 100).toFixed(2) + "%"
        });
        console.error(err);
    }
};