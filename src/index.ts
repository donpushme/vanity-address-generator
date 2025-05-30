import { VanityAddressGenerator } from './vanity-generator.js';
import { VanityConfig, VanityConfigWithWorkers } from './types.js';

// Add environment check at startup
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI?.substring(0, 20) + '...' // Only show the start for security
});

function parseArgs(): VanityConfigWithWorkers {
  const args = process.argv.slice(2);
  const config: any = {
    numWorkers: 8, // default to 8 workers
    caseSensitive: true // default to case insensitive
  };

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
      case '--workers':
        config.numWorkers = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log(`
Usage: ts-node src/index.ts [options]

Options:
  --prefix <text>       Address must start with this
  --suffix <text>       Address must end with this
  --contains <text>     Address must contain this
  --case-sensitive      Enable case sensitive matching
  --workers <number>    Number of worker processes (default: 8)
  --help               Show this help message

Examples:
  ts-node src/index.ts --prefix Sol
  ts-node src/index.ts --suffix Dao --workers 10
  ts-node src/index.ts --contains ABC --case-sensitive
        `);
        process.exit(0);
    }
  }

  return config;
}

async function main(): Promise<void> {
  try {
    const config = parseArgs();
    const { numWorkers, ...vanityConfig } = config;

    // Validate that at least one pattern is specified
    if (!vanityConfig.prefix && !vanityConfig.suffix && !vanityConfig.contains) {
      console.error('Error: At least one pattern (prefix, suffix, or contains) must be specified');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    console.log('\nStarting generation...');
    
    const generator = new VanityAddressGenerator(numWorkers);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nReceived interrupt signal...');
      generator.stop();
      process.exit(0);
    });

    const result = await generator.generate(vanityConfig);
    
    if (result) {
      console.log('\nGeneration completed successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
