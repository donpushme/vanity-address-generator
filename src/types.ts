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
      privateKey: string;
      attempts: number;
    };
    attempts?: number;
  }

export interface VanityConfigWithWorkers extends VanityConfig {
  numWorkers: number;
}