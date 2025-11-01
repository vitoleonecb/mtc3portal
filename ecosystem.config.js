module.exports = {
  apps: [
    {
      name: "mtc3-backend",
      cwd: "/var/www/mtc3portal/back_end",
      script: "app.js",          // or "npm"
      // args: "start",          // <-- use these two lines instead if your package.json uses `npm start`
      // script: "npm",
      env: {
        NODE_ENV: "production"
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      error_file: "/var/www/mtc3portal/logs/mtc3-backend.err.log",
      out_file: "/var/www/mtc3portal/logs/mtc3-backend.out.log",
      time: true
    }
    // Add a frontend process later if you want PM2 to serve it
    // {
    //   name: "mtc3-frontend",
    //   cwd: "/var/www/mtc3portal/front_end/my-app",
    //   script: "serve",
    //   args: "-s build -l 3000",
    //   env: { NODE_ENV: "production" }
    // }
  ]
}
