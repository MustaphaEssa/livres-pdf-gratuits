# Déploiement sur VPS (disque persistant)

Guide pour héberger **Livre PDF Gratuit** sur un VPS Linux (Ubuntu/Debian).
Les PDF et couvertures restent sur le disque du serveur (`public/uploads/`),
servis directement par nginx. L'application tourne via `next start` derrière
nginx, gérée par systemd.

---

## 1. Prérequis sur le VPS

```bash
# Node.js 20+ (via nvm ou nodesource) et nginx
node -v            # doit afficher v20+ (ou v22)
sudo apt update && sudo apt install -y nginx git
```

## 2. Récupérer le code

```bash
sudo mkdir -p /var/www && cd /var/www
# via git (recommandé) ou rsync/scp depuis ta machine
git clone <ton-dépôt> livre-pdf-gratuit
cd livre-pdf-gratuit
```

> ⚠️ Les dossiers `public/uploads/` et le fichier `prisma/dev.db` sont
> **ignorés par git** (voir `.gitignore`). Ils doivent être **transférés
> séparément** depuis ta machine de développement (voir §6).

## 3. Variables d'environnement (`.env`)

Crée `/var/www/livre-pdf-gratuit/.env` :

```ini
# Chemin ABSOLU vers la base SQLite (sur le disque persistant)
DATABASE_URL="file:/var/www/livre-pdf-gratuit/prisma/dev.db"

# Secret de session — génère-en un nouveau pour la prod :
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
AUTH_SECRET="REMPLACE-PAR-UN-SECRET-FORT"

# Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=52428800

NEXTAUTH_URL="https://votre-domaine.com"
```

> 🔒 En production, `NODE_ENV=production` active automatiquement le flag
> `secure` des cookies de session → **le site DOIT être servi en HTTPS**
> (voir §7), sinon la connexion admin/utilisateur ne fonctionnera pas.

## 4. Installer, générer la base, builder

```bash
npm ci                      # installe les dépendances
npx prisma generate
npx prisma db push          # crée les tables si base neuve
# (optionnel) npx prisma db seed   # crée l'admin + catégories si base vide
npm run build               # build de production
```

## 5. Lancer l'application (systemd)

```bash
sudo cp deploy/livre-pdf-gratuit.service.example \
        /etc/systemd/system/livre-pdf-gratuit.service
# adapte User / WorkingDirectory dans le fichier si besoin
sudo systemctl daemon-reload
sudo systemctl enable --now livre-pdf-gratuit
sudo systemctl status livre-pdf-gratuit      # doit être "active (running)"
# logs : journalctl -u livre-pdf-gratuit -f
```

## 6. Transférer la base et les fichiers uploadés

Depuis ta machine de dev (contenu non versionné) vers le VPS :

```bash
# Base de données (186 livres + admin)
scp prisma/dev.db user@vps:/var/www/livre-pdf-gratuit/prisma/dev.db

# PDF + couvertures (~3,8 Go) — rsync reprend en cas de coupure
rsync -avz --progress public/uploads/ \
      user@vps:/var/www/livre-pdf-gratuit/public/uploads/
```

Puis donne les droits au service et redémarre :

```bash
sudo chown -R www-data:www-data /var/www/livre-pdf-gratuit/public/uploads
sudo chown www-data:www-data /var/www/livre-pdf-gratuit/prisma/dev.db
sudo systemctl restart livre-pdf-gratuit
```

## 7. nginx + HTTPS

```bash
sudo cp deploy/nginx.conf.example \
        /etc/nginx/sites-available/livre-pdf-gratuit
# édite le server_name et $APP_ROOT dans ce fichier
sudo ln -s /etc/nginx/sites-available/livre-pdf-gratuit /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS gratuit (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

---

## Mises à jour ultérieures

```bash
cd /var/www/livre-pdf-gratuit
git pull
npm ci
npx prisma generate && npx prisma db push
npm run build
sudo systemctl restart livre-pdf-gratuit
```

Les uploads et la base (ignorés par git) **ne sont pas touchés** par `git pull`.

## Sauvegardes (important)

Deux choses à sauvegarder régulièrement (cron) :

```bash
# Base de données
cp /var/www/livre-pdf-gratuit/prisma/dev.db /backups/dev-$(date +%F).db
# Fichiers
rsync -a /var/www/livre-pdf-gratuit/public/uploads/ /backups/uploads/
```

## Points d'attention

- **Espace disque** : prévois > 5 Go (3,8 Go de PDF actuels + marge pour les
  futurs uploads admin).
- **SQLite** convient pour un trafic lecture dominant. Si tu attends beaucoup
  d'écritures concurrentes, migre vers PostgreSQL (le schéma est compatible,
  il suffit de changer le `provider` et `DATABASE_URL`).
- Les PDF sont servis par nginx avec un cache de 30 jours ; le bouton
  « Télécharger » passe lui par l'app (pour compter les téléchargements).
- Nouveaux uploads admin : écrits dans `public/uploads/`, servis immédiatement
  sans rebuild (`next start` lit le disque en direct).
