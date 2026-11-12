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

# Toujours utiliser le Prisma installé localement (le projet est épinglé sur
# Prisma 6). `npx prisma` tout court peut récupérer Prisma 7 depuis le réseau,
# qui casse sous Node 20 — d'où l'échec possible du `db push`.
PRISMA="./node_modules/.bin/prisma"
[ -x "$PRISMA" ] || PRISMA="npx --no-install prisma"

echo "==> 1/6  Récupération du code (git pull origin $BRANCH)"
# `next build` re-patche package-lock.json (dépendances @next/swc) côté serveur,
# ce qui ferait échouer le git pull suivant ("local changes would be overwritten").
# On écarte cette modif auto avant de récupérer le code (le lockfile fait foi côté dépôt).
git checkout -- package-lock.json 2>/dev/null || true
git pull origin "$BRANCH"

echo "==> 2/6  Installation des dépendances"
# npm ci si package-lock.json présent (reproductible), sinon npm install.
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> 3/6  Synchronisation du schéma de base (prisma db push)"
$PRISMA db push

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
