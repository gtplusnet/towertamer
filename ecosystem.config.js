module.exports = {
  apps: [
    {
      name: 'towertamer-frontend',
      cwd: './frontend',
      script: 'yarn',
      args: 'dev',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
