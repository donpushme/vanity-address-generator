module.exports = {
  apps: [{
    name: 'vanity-generator',
    script: 'ts-node',
    args: 'src/index.ts --suffix mayo --workers 8',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env'  // This will load the .env file
  }]
}; 