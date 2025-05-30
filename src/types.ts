// src/types.ts
export interface VanityConfig {
    prefix?: string;
    suffix?: string;
    contains?: string;
    caseSensitive?: boolean;
    maxAttempts?: number;
  }
  
  export interface WorkerMessage {
    type: 'start' | 'stop' | 'result' | 'progress';
    config?: VanityConfig;
    result?: {
      publicKey: string;
      privateKey: Uint8Array;
      attempts: number;
    };
    attempts?: number;
  }

export interface VanityConfigWithWorkers extends VanityConfig {
  numWorkers: number;
}