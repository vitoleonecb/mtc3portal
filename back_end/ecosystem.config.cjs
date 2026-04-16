module.exports = {
  apps: [
    {
      name: 'api',
      script: 'app.js',
      node_args: '--experimental-specifier-resolution=node',
      stop_exit_codes: [0],
      max_restarts: 10,
      min_uptime: '5s',
    },
    {
      name: 'module-worker',
      script: 'workers/moduleWorker.js',
      node_args: '--experimental-specifier-resolution=node',
    },
    {
      name: 'notification-worker',
      script: 'workers/notificationWorker.js',
      node_args: '--experimental-specifier-resolution=node',
    },
    {
      name: 'ai-analysis-worker',
      script: 'workers/aiAnalysisWorker.js',
      node_args: '--experimental-specifier-resolution=node',
    },
  ],
};
