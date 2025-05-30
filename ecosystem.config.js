module.exports = {
  apps: [{
    name: 'vanity-generator',
    script: './src/index.ts',
    interpreter: 'node_modules/.bin/ts-node',
    args: '--suffix mayo --workers 8',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env'  // This will load the .env file
  }]
}; 