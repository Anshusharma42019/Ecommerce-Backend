module.exports = {
  apps: [
    {
      name: 'triven-ecommerce',
      script: 'server.js',
      instances: 'max',           // Use all CPU cores
      exec_mode: 'cluster',       // Cluster mode for load balancing
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      autorestart: true,
      // Graceful shutdown
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/triven-ecommerce.git',
      path: '/var/www/triven-ecommerce',
      'post-deploy': 'npm install && pm2 reload pm2.config.js --env production',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
