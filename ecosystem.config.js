module.exports = {
  apps: [
    {
      name: "readflow-api",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "/var/log/readflow/error.log",
      out_file: "/var/log/readflow/out.log",
      time: true,
    },
  ],
};
