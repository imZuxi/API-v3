module.exports = {
    apps: [{
        "name": "API",
        "script": 'api.js',
        "ignore_watch": [
            "./node_modules",
          ],
          "max_memory_restart": "2G",
          "instances": "8",
          "exec_mode": "cluster",
          "env": {
            "NODE_ENV": "development"
          },
          "env_production": {
            "NODE_ENV": "production"
          }
    }],
    "deploy": {
        "production": {
            "user": 'imzuxi',
            "ref": 'origin/main',
            "post-deploy": "npm install"
        }
    }
};
