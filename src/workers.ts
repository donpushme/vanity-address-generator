import { parentPort } from 'worker_threads';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { VanityConfig, WorkerMessage } from './types.js';

let isRunning = false;
let config: VanityConfig = {};

function generateVanityAddress(): void {
  let attempts = 0;
  const startTime = Date.now();
  
  while (isRunning && attempts < (config.maxAttempts || Infinity)) {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    attempts++;
    
    // Check every 10000 attempts to avoid blocking
    if (attempts % 10000 === 0) {
      parentPort?.postMessage({
        type: 'progress',
        attempts
      } as WorkerMessage);
      
      // Small delay to prevent CPU throttling
      setTimeout(() => {}, 0);
    }
    
    if (matchesPattern(publicKey)) {
      const privateKeyArray = Array.from(keypair.secretKey);
      const privateKey = keypair.secretKey.toString();
      
      parentPort?.postMessage({
        type: 'result',
        result: {
          publicKey,
          privateKey,
          attempts
        }
      } as WorkerMessage);
      
      isRunning = false;
      return;
    }
  }
  
  if (attempts >= (config.maxAttempts || Infinity)) {
    console.log(`Worker stopped after ${attempts} attempts without finding match`);
  }
}

function matchesPattern(address: string): boolean {
  const checkAddress = config.caseSensitive ? address : address.toLowerCase();
  const prefix = config.caseSensitive ? config.prefix : config.prefix?.toLowerCase();
  const suffix = config.caseSensitive ? config.suffix : config.suffix?.toLowerCase();
  const contains = config.caseSensitive ? config.contains : config.contains?.toLowerCase();
  
  if (prefix && !checkAddress.startsWith(prefix)) {
    return false;
  }
  
  if (suffix && !checkAddress.endsWith(suffix)) {
    return false;
  }
  
  if (contains && !checkAddress.includes(contains)) {
    return false;
  }
  
  return true;
}

parentPort?.on('message', (message: WorkerMessage) => {
  switch (message.type) {
    case 'start':
      config = message.config || {};
      isRunning = true;
      generateVanityAddress();
      break;
    case 'stop':
      isRunning = false;
      break;
  }
});