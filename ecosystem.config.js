module.exports = {
  apps: [{
    name: 'vanity-generator',
    script: 'ts-node',
    args: 'src/index.ts --suffix dao --workers 8',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      MONGODB_URI: 'your_mongodb_uri_here' // Replace with your MongoDB URI
    }
  }]
}; 