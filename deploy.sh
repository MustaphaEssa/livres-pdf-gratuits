#!/usr/bin/env bash
#
# Déploiement du site sur le serveur de production (VPS + PM2).
#
#   Usage :  ./deploy.sh
#
# Enchaîne : git pull -> dépendances -> insertion des articles ->
#            build Next.js -> redémarrage PM2.
#
# Idempotent : relançable autant de fois que nécessaire. Le script
# d'articles ignore ceux déjà présents, rien n'est écrasé.
#
set -euo pipefail

# Se place dans le dossier du script (racine du projet), où qu'il soit lancé.
cd "$(dirname "$0")"

APP_NAME="livrespdfgratuits"   # nom du process PM2 (voir ecosystem.config.js)
BRANCH="main"

echo "==> 1/5  Récupération du code (git pull origin $BRANCH)"
git pull origin "$BRANCH"

echo "==> 2/5  Installation des dépendances"
# npm ci si package-lock.json présent (reproductible), sinon npm install.
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> 3/6  Synchronisation du schéma de base (prisma db push)"
npx prisma db push

echo "==> 4/6  Insertion des articles de blog (ignore ceux déjà présents)"
node scripts/add-blog-articles.mjs

echo "==> 5/6  Build de production (prisma generate + next build)"
npm run build

echo "==> 6/6  Redémarrage de l'application ($APP_NAME)"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  echo "    Process PM2 introuvable, démarrage via ecosystem.config.js"
  pm2 start ecosystem.config.js
fi

echo ""
echo "✅ Déploiement terminé."
echo "   Logs :  pm2 logs $APP_NAME"
