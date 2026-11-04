# Livre PDF Gratuit — livrespdfgratuits.com

Bibliothèque de livres PDF gratuits — Next.js 15 (App Router) + Prisma + PostgreSQL + Tailwind v4.

## Développement local

Prérequis : Node.js 20+ et un PostgreSQL accessible.

```bash
npm install
cp .env.example .env        # remplir DATABASE_URL, AUTH_SECRET, etc.
npx prisma db push          # crée le schéma dans la base PostgreSQL
npm run db:seed             # (optionnel) données de démo + compte admin
npm run dev                 # http://localhost:3000
```

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` | `prisma generate` + build de production |
| `npm run start` | Serveur de production (après `build`) |
| `npm run db:seed` | Données de démo + compte admin |
| `npm run db:studio` | Interface Prisma Studio |

---

## Déploiement VPS (PostgreSQL + PM2 + Nginx + HTTPS)

### 1. Prérequis sur le VPS
```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql nginx
sudo npm install -g pm2
```

### 2. Base de données PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE "livre-pdf-gratuit";
CREATE USER livre WITH ENCRYPTED PASSWORD 'un-mot-de-passe-solide';
GRANT ALL PRIVILEGES ON DATABASE "livre-pdf-gratuit" TO livre;
\q
```

### 3. Récupérer et configurer l'app
```bash
cd /var/www
git clone https://github.com/MustaphaEssa/livre-pdf-gratuit.git livrespdfgratuits
cd livrespdfgratuits
npm ci
cp .env.example .env
nano .env    # voir les variables ci-dessous
```

Variables `.env` importantes :
```env
DATABASE_URL="postgresql://livre:un-mot-de-passe-solide@localhost:5432/livre-pdf-gratuit?schema=public"
AUTH_SECRET="<openssl rand -base64 48>"
NEXT_PUBLIC_SITE_URL="https://livrespdfgratuits.com"
ADMIN_EMAIL="admin@livrespdfgratuits.com"
ADMIN_PASSWORD="<choisir avant le seed>"
# SMTP_* pour l'envoi des emails de réinitialisation de mot de passe
```

### 4. Schéma + données + build
```bash
npx prisma db push
npm run db:seed        # crée le compte admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run build
```

### 5. Lancer avec PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup            # suivre l'instruction affichée (démarrage auto au boot)
```
L'app écoute désormais sur `127.0.0.1:3000`.

### 6. Nginx (reverse proxy)
```bash
sudo cp deploy/nginx-livrespdfgratuits.conf /etc/nginx/sites-available/livrespdfgratuits
sudo ln -s /etc/nginx/sites-available/livrespdfgratuits /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 7. HTTPS (Let's Encrypt, gratuit)
Pointe d'abord le DNS de `livrespdfgratuits.com` (et `www`) vers l'IP du VPS, puis :
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d livrespdfgratuits.com -d www.livrespdfgratuits.com
```
Certbot ajoute le HTTPS (443) et la redirection HTTP→HTTPS, et renouvelle le
certificat automatiquement.

### Mettre à jour le site plus tard
```bash
cd /var/www/livrespdfgratuits
git pull
npm ci
npx prisma db push     # si le schéma a changé
npm run build
pm2 reload livrespdfgratuits
```

### À sauvegarder régulièrement
- La base PostgreSQL : `pg_dump "livre-pdf-gratuit" > backup.sql`
- Le dossier `public/uploads/` (PDF + couvertures) — **non versionné**, vit sur le disque.
