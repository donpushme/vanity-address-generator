import { VanityAddressGenerator } from './vanity-generator';
import { VanityConfig, VanityConfigWithWorkers } from './types';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser(): Promise<VanityConfigWithWorkers> {
  return new Promise((resolve) => {
    console.log('\n=== Solana Vanity Address Generator ===');
    console.log('Generate vanity addresses with custom patterns\n');
    
    const config: VanityConfig = {};
    
    rl.question('Enter prefix (optional): ', (prefix) => {
      if (prefix.trim()) config.prefix = prefix.trim();
      
      rl.question('Enter suffix (optional): ', (suffix) => {
        if (suffix.trim()) config.suffix = suffix.trim();
        
        rl.question('Enter contains pattern (optional): ', (contains) => {
          if (contains.trim()) config.contains = contains.trim();
          
          rl.question('Case sensitive? (y/n, default: n): ', (caseSensitive) => {
            config.caseSensitive = caseSensitive.toLowerCase() === 'y';
            
            rl.question('Max attempts (optional, default: unlimited): ', (maxAttempts) => {
              if (maxAttempts.trim() && !isNaN(Number(maxAttempts))) {
                config.maxAttempts = Number(maxAttempts);
              }
              
              rl.question('Number of worker processes (default: CPU cores): ', (workers) => {
                const numWorkers = workers.trim() && !isNaN(Number(workers)) 
                  ? Number(workers) 
                  : require('os').cpus().length;
                
                resolve({ ...config, numWorkers });
              });
            });
          });
        });
      });
    });
  });
}

async function main() {
  try {
    const config = await promptUser();
    const { numWorkers, ...vanityConfig } = config as any;
    
    // Validate that at least one pattern is specified
    if (!vanityConfig.prefix && !vanityConfig.suffix && !vanityConfig.contains) {
      console.log('Error: At least one pattern (prefix, suffix, or contains) must be specified');
      rl.close();
      return;
    }
    
    console.log('\nStarting generation...');
    console.log('Press Ctrl+C to stop\n');
    
    const generator = new VanityAddressGenerator(numWorkers);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nReceived interrupt signal...');
      generator.stop();
      rl.close();
      process.exit(0);
    });
    
    const result = await generator.generate(vanityConfig);
    
    console.log('\n=== RESULT ===');
    console.log(`Public Key:  ${result.publicKey}`);
    console.log(`Private Key: ${result.privateKey}`);
    console.log(`Attempts:    ${result.attempts.toLocaleString()}`);
    console.log('\n⚠️  IMPORTANT: Save your private key securely and never share it!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}
