// Configuration PM2 — gestionnaire de process pour l'app en production.
// Lancer :  pm2 start ecosystem.config.js
// Logs :    pm2 logs livrespdfgratuits
// Au boot : pm2 startup && pm2 save
module.exports = {
  apps: [
    {
      name: "livrespdfgratuits",
      script: "npm",
      args: "start", // => next start (voir package.json)
      cwd: "/home/vcp/livrespdfgratuits",
      instances: 1, // Postgres permet de passer en "max" (mode cluster) si besoin
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
      },
    },
  ],
};
