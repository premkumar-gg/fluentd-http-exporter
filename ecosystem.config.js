module.exports = {
  apps : [{
    name   : "fluentd-http-exporter",
    script : "./src/middleware.js",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
};
