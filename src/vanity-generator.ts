import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { VanityConfig, WorkerMessage } from './types';
import { connectDB } from './db/connection';
import TokenAddress from './models/TokenAddress';

export class VanityAddressGenerator {
  private workers: Worker[] = [];
  private isRunning = false;
  private totalAttempts = 0;
  private startTime = 0;
  private progressInterval?: NodeJS.Timeout;
  private addressesFound = 0;
  private readonly TARGET_ADDRESSES = 1_000_000;

  constructor(private numWorkers: number = Math.min(8, os.cpus().length)) {
    console.log(`Initializing ${numWorkers} worker processes`);
  }

  async generate(config: VanityConfig): Promise<{ publicKey: string; privateKey: string; attempts: number }> {
    return new Promise(async (resolve, reject) => {
      // Connect to MongoDB first
      await connectDB();
      
      this.startTime = Date.now();
      this.totalAttempts = 0;
      this.addressesFound = 0;
      this.isRunning = true;

      // Validate config
      if (!config.prefix && !config.suffix && !config.contains) {
        reject(new Error('At least one pattern (prefix, suffix, or contains) must be specified'));
        return;
      }

      console.log('Starting vanity address generation with config:', config);
      console.log(`Using ${this.numWorkers} worker processes`);
      console.log(`Target: ${this.TARGET_ADDRESSES.toLocaleString()} addresses`);

      // Create workers
      for (let i = 0; i < this.numWorkers; i++) {
        const worker = new Worker(path.join(__dirname, 'workers.ts'), {
          execArgv: ['-r', 'ts-node/register']
        });
        
        worker.on('message', async (message: WorkerMessage) => {
          switch (message.type) {
            case 'result':
              if (message.result) {
                try {
                  // Save to MongoDB
                  await TokenAddress.create({
                    address: message.result.publicKey,
                    key: message.result.privateKey,
                  });
                  
                  this.addressesFound++;
                  console.log(`\nSaved address ${this.addressesFound.toLocaleString()} of ${this.TARGET_ADDRESSES.toLocaleString()}`);
                  
                  // If we've reached our target, stop
                  if (this.addressesFound >= this.TARGET_ADDRESSES) {
                    console.log('\nReached target number of addresses!');
                    this.cleanup();
                    resolve(message.result);
                    return;
                  }
                  
                  // Continue generating
                  worker.postMessage({
                    type: 'start',
                    config
                  } as WorkerMessage);
                } catch (error) {
                  console.error('Error saving address:', error);
                }
              }
              break;
            case 'progress':
              this.totalAttempts += message.attempts || 0;
              break;
          }
        });

        worker.on('error', (error) => {
          console.error(`Worker ${i} error:`, error);
          this.cleanup();
          reject(error);
        });

        this.workers.push(worker);
      }

      // Start progress reporting
      this.startProgressReporting();

      // Start all workers
      this.workers.forEach(worker => {
        worker.postMessage({
          type: 'start',
          config
        } as WorkerMessage);
      });

      // Set timeout if maxAttempts is specified
      if (config.maxAttempts) {
        setTimeout(() => {
          if (this.isRunning) {
            this.cleanup();
            reject(new Error(`No match found after ${config.maxAttempts} attempts`));
          }
        }, (config.maxAttempts / this.numWorkers) * 10); // Rough estimate
      }
    });
  }

  private startProgressReporting(): void {
    this.progressInterval = setInterval(() => {
      if (this.isRunning) {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const rate = Math.round(this.totalAttempts / elapsed);
        process.stdout.write(`\rAttempts: ${this.totalAttempts.toLocaleString()} | Rate: ${rate.toLocaleString()}/s | Time: ${elapsed.toFixed(1)}s | Addresses: ${this.addressesFound.toLocaleString()}/${this.TARGET_ADDRESSES.toLocaleString()}`);
      }
    }, 1000);
  }

  private cleanup(): void {
    this.isRunning = false;
    
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.workers.forEach(worker => {
      worker.postMessage({ type: 'stop' } as WorkerMessage);
      worker.terminate();
    });
    
    this.workers = [];
  }

  stop(): void {
    console.log('\nStopping generation...');
    this.cleanup();
  }
}