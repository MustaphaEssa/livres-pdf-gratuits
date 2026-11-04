# Livre PDF Gratuit

Bibliothèque de livres PDF gratuits — Next.js 15 (App Router) + Prisma + Tailwind v4.

## Développement local

```bash
npm install
cp .env.example .env        # puis remplir les valeurs (au minimum AUTH_SECRET)
npx prisma db push          # crée le schéma dans la base SQLite
npm run db:seed             # (optionnel) données de démo
npm run dev                 # http://localhost:3000
```

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` | `prisma generate` + build de production |
| `npm run start` | Serveur de production (après `build`) |
| `npm run db:seed` | Insère les données de démo |
| `npm run db:studio` | Interface Prisma Studio |

## Déploiement sur un VPS

Le projet utilise **SQLite** par défaut : une base dans un simple fichier, idéale
pour un VPS mono-instance.

```bash
git clone <repo> && cd livre-pdf-gratuit
npm ci
cp .env.example .env        # remplir AUTH_SECRET, NEXT_PUBLIC_SITE_URL, SMTP…
npx prisma db push          # crée/maj le schéma
npm run db:seed             # (optionnel)
npm run build
npm run start               # ou via PM2 : pm2 start "npm run start" --name livre-pdf
```

Puis un reverse proxy (Nginx/Caddy) devant le port 3000.

### Points importants

- **`.env`, `prisma/dev.db` et `public/uploads/*` ne sont pas versionnés.** Sur le
  VPS, le fichier SQLite et le dossier d'uploads vivent sur le disque et doivent
  être **persistants et sauvegardés** (une sauvegarde = copie du `.db` + du dossier
  `uploads`).
- Générer un vrai secret : `openssl rand -base64 48` → `AUTH_SECRET`.
- **Une seule instance** de l'app avec SQLite (pas de cluster PM2 / réplicas).
  Pour scaler horizontalement, passer à PostgreSQL (voir ci-dessous).

### Passer à PostgreSQL (optionnel)

1. `provider = "postgresql"` dans `prisma/schema.prisma`
2. `DATABASE_URL="postgresql://…"` dans `.env`
3. `npx prisma db push` puis `npm run db:seed`
