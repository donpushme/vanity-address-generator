import { VanityAddressGenerator } from './vanity-generator';
import { VanityConfig, VanityConfigWithWorkers } from './types';

// Add environment check at startup
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI?.substring(0, 20) + '...' // Only show the start for security
});

const config = {
  numWorkers: 4,
  prefix: "",
  suffix: "mayo",
  contains: "",
  caseSensitive: true,
};

async function main(): Promise<void> {
  try {
    const { numWorkers, ...vanityConfig } = config;

    // Validate that at least one pattern is specified
    if (
      !vanityConfig.prefix &&
      !vanityConfig.suffix &&
      !vanityConfig.contains
    ) {
      console.error(
        "Error: At least one pattern (prefix, suffix, or contains) must be specified"
      );
      console.log("Use --help for usage information");
      process.exit(1);
    }

    console.log("\nStarting generation...");

    const generator = new VanityAddressGenerator(numWorkers);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\nReceived interrupt signal...");
      generator.stop();
      process.exit(0);
    });

    const result = await generator.generate(vanityConfig);

    if (result) {
      console.log("\nGeneration completed successfully!");
      process.exit(0);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
