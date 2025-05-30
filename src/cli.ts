import { VanityAddressGenerator } from './vanity-generator';
import { VanityConfig } from './types';

const args = process.argv.slice(2);

function parseArgs(): VanityConfig & { workers?: number } {
  const config: any = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prefix':
        config.prefix = args[++i];
        break;
      case '--suffix':
        config.suffix = args[++i];
        break;
      case '--contains':
        config.contains = args[++i];
        break;
      case '--case-sensitive':
        config.caseSensitive = true;
        break;
      case '--max-attempts':
        config.maxAttempts = parseInt(args[++i]);
        break;
      case '--workers':
        config.workers = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
Usage: npm run cli -- [options]

Options:
  --prefix <string>      Address must start with this
  --suffix <string>      Address must end with this  
  --contains <string>    Address must contain this
  --case-sensitive       Enable case sensitive matching
  --max-attempts <num>   Maximum attempts before giving up
  --workers <num>        Number of worker processes (default: CPU cores)
  --help                 Show this help

Examples:
  npm run cli -- --prefix ABC
  npm run cli -- --contains 123 --case-sensitive
  npm run cli -- --prefix Sol --suffix Ana --workers 8
        `);
        process.exit(0);
    }
  }
  
  return config;
}

async function runCLI() {
  const config = parseArgs();
  const { workers, ...vanityConfig } = config;
  
  if (!vanityConfig.prefix && !vanityConfig.suffix && !vanityConfig.contains) {
    console.error('Error: At least one pattern must be specified');
    console.log('Use --help for usage information');
    process.exit(1);
  }
  
  console.log('Configuration:', vanityConfig);
  
  const generator = new VanityAddressGenerator(workers);
  
  process.on('SIGINT', () => {
    console.log('\nStopping...');
    generator.stop();
    process.exit(0);
  });
  
  try {
    const result = await generator.generate(vanityConfig);
    
    console.log('\n=== RESULT ===');
    console.log(`Public Key:  ${result.publicKey}`);
    console.log(`Private Key: ${result.privateKey}`);
    console.log(`Attempts:    ${result.attempts.toLocaleString()}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runCLI();
}