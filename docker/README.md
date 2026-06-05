<div align="center">

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/supabase/supabase/3-self-hosted-deployment)

</div>

# Self-Hosted Supabase with Docker

Configuration Docker Compose pour Supabase auto-hébergé : une stack complète avec tous les services Supabase, en local ou sur ton infrastructure.

> **Ce fork ajoute deux fonctionnalités**, pilotables directement depuis le dashboard Studio :
> - **Sites** — hébergement web statique/SPA intégré via nginx (déploie un front-end, obtiens un bloc serveur + TLS).
> - **Gestion des edge functions en auto-hébergé** — déployer, éditer, supprimer des fonctions et gérer leurs secrets depuis le dashboard (l'amont les garde en lecture seule).
>
> Ces fonctionnalités vivent dans le **code source** de Studio : l'image publiée `supabase/studio` ne les contient **pas**. Le script d'installation build donc Studio depuis la source. Voir [docker-compose.local.yml](./docker-compose.local.yml) pour l'override utilisé.

## 🚀 Installation en une commande

Le script [`install.sh`](./install.sh) installe tout en autonomie : il met le système à jour, installe Docker + les plugins **buildx** et **compose**, te demande le login/mot de passe du dashboard, génère tous les secrets, build Studio depuis la source, démarre la stack complète **+** les services d'hébergement web (nginx + hosting-agent + SFTP), attend que tout soit *healthy*, puis affiche et enregistre tous les accès.

### Les ajouts de ce fork

En plus de la stack Supabase standard (Postgres, Auth, Storage, Realtime, Kong, Studio, Edge Runtime…), l'override démarre :

- **nginx (jonasal/nginx-certbot)** — reverse proxy qui termine le TLS, sert le dashboard et les sites hébergés (certificats Let's Encrypt automatiques).
- **hosting-agent** — petit sidecar privilégié ([`hosting-agent/`](./hosting-agent/)) qui écrit les blocs serveur nginx et recharge nginx pour la fonctionnalité Sites. C'est le **seul** composant ayant accès au socket Docker (Studio n'y touche jamais).
- **SFTP (atmoz/sftp)** — accès SFTP chrooté aux docroots des sites (FTPS optionnel via le profil `ftps`).

### Prérequis

- Un serveur Linux (Debian/Ubuntu recommandé), lancé en **root** ou avec `sudo`.
- Le **dépôt complet** cloné — pas seulement le dossier `docker/` — car Studio est buildé depuis `apps/studio`.
- Ports entrants ouverts : **80, 443, 8000, 2222** (et **22** pour SSH). Pour un vrai certificat TLS, fais pointer l'**enregistrement A** de ton domaine vers le serveur.

### Installation de A à Z

```bash
# 1. Cloner le fork COMPLET sur le serveur (le script a besoin de apps/studio pour builder Studio)
git clone <url-de-ton-fork> supabase
cd supabase

# 2a. Mode local / IP — certificat auto-signé, dashboard sur http://<ip-serveur>:8000
sudo bash docker/install.sh

# 2b. Ou avec un domaine — vrai TLS Let's Encrypt
sudo bash docker/install.sh --domain supa.exemple.com --email toi@exemple.com
```

Au démarrage, le script **te demande le nom d'utilisateur et le mot de passe** souhaités pour le dashboard (laisse le mot de passe vide pour en générer un fort ; évite `$` et `\`). Tu peux aussi les fournir en non-interactif via `--user` / `--password` (ou les variables `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`), et `-y` pour ne rien demander.

Cette unique commande va :

1. Faire `apt update` **+ `apt upgrade`**, puis installer **Docker Engine + CLI + containerd + les plugins buildx & compose** (dépôt Docker officiel), plus `openssl`, `git`, `jq`, `curl`, `gnupg`. (Corrige l'erreur `docker compose: unknown flag -f`.)
2. Ajouter un **swapfile** sur les petits serveurs (peu de RAM) pour éviter que le build de Studio soit tué (OOM) — désactivable avec `--no-swap`.
3. Générer **tous** les secrets et clés API dans `docker/.env` — `JWT_SECRET`, `ANON_KEY`/`SERVICE_ROLE_KEY` (legacy), clés asymétriques JWKS + clés opaques `sb_publishable_*`/`sb_secret_*`, `POSTGRES_PASSWORD`, `DASHBOARD_PASSWORD`, et un `HOSTING_AGENT_TOKEN` aléatoire — puis régler les URLs publiques.
4. Créer les dossiers hôtes (dont des **clés hôte SFTP persistantes**) et câbler l'override dans `COMPOSE_FILE`.
5. **Builder Studio depuis la source** (ou **pull une image pré-buildée** avec `--studio-image`, voir ci-dessous) et démarrer nginx + hosting-agent + SFTP + toute la stack Supabase, en attendant la santé des services.
6. Afficher **et enregistrer** tous les accès, logins, mots de passe et secrets dans `docker/ACCESS-CREDENTIALS.txt` (`chmod 600`).

> Le premier build compile Studio (une app Next.js) — compte plusieurs minutes et **plusieurs Go de RAM**. Sur un petit serveur, utilise plutôt l'image pré-buildée ci-dessous.

### Petit serveur : image pré-buildée (sans builder sur place)

Builder Studio sur le serveur (`next build`) est gourmand en RAM et peut échouer (OOM) sur un petit VPS. Plus fiable : builder l'image **une fois** ailleurs, puis la **pull** sur le serveur.

1. **Publier l'image** via GitHub Actions → GHCR : onglet **Actions** du dépôt → workflow **« Build self-hosted Studio image »** → *Run workflow*. Il build et pousse `ghcr.io/<owner>/supabase-studio:fork`. Ensuite, rends le package GHCR **public** (Packages → settings), ou fais `docker login ghcr.io` sur le serveur.
   _Sans CI_ : sur une machine ≥ 8 Go de RAM, `docker build -f apps/studio/Dockerfile --target production -t <ref> . && docker push <ref>`.
2. **Installer en mode pull** sur le serveur (aucun build, juste un téléchargement) :
   ```bash
   sudo bash docker/install.sh --studio-image ghcr.io/<owner>/supabase-studio:fork
   ```
   En mode image, le `next build` n'a jamais lieu sur le serveur (et aucun swap n'est créé).

### Options

| Flag / variable d'env | Effet |
| --- | --- |
| `--user <u>` / `DASHBOARD_USERNAME` | Nom d'utilisateur du dashboard (demandé ; défaut `supabase`). |
| `--password <p>` / `DASHBOARD_PASSWORD` | Mot de passe du dashboard (demandé ; vide = généré). Évite `$` et `\`. |
| `--domain <d>` / `DOMAIN` | Domaine public pointant vers le serveur — active le vrai TLS Let's Encrypt. |
| `--email <e>` / `EMAIL` | Email de contact Let's Encrypt (défaut `admin@<domaine>`). |
| `--studio-image <ref>` / `STUDIO_IMAGE` | **Pull une image Studio pré-buildée** au lieu de builder sur le serveur (idéal petit VPS), ex. `ghcr.io/<owner>/supabase-studio:fork`. |
| `--enable-ftps` | Démarre aussi le service FTPS (désactivé par défaut ; mot de passe généré s'il manque). |
| `--skip-deps` | N'installe pas les paquets système (saute aussi `apt upgrade`). |
| `--reset-secrets` | Régénère `.env` même s'il existe. **Destructif** pour une base existante. |
| `--no-swap` | Ne crée jamais de swapfile. |
| `-y`, `--yes` | Non-interactif : ne demande rien (utilise flags/env/défauts). |
| `-h`, `--help` | Affiche l'aide. |

### Après l'installation — accès

Tout est affiché dans la console et enregistré dans [`docker/ACCESS-CREDENTIALS.txt`](./ACCESS-CREDENTIALS.txt) (logins, mots de passe **et tous les secrets**, `chmod 600`) :

- **Dashboard** — `http://<ip-serveur>:8000` (ou `https://<domaine>`) ; identifiants dans la sortie.
- **API** — URL de base + clés `anon`, `service_role`, publishable et secret, + le JWT secret.
- **Base de données** — chaîne de connexion Postgres (via Supavisor, ports 5432 / 6543).
- **Sites** — à gérer depuis **Studio → Sites** ; nginx sert chaque site sur 80/443.
- **Edge functions** — code et secrets gérés depuis **Studio → Edge Functions**. Après changement de secrets : `docker compose restart functions`.
- **SFTP** — aucun utilisateur par défaut. Ajoute-en un **par site** dans [`volumes/sftp/users.conf`](./volumes/sftp/users.conf) (format `user:pass:e:1001`), en utilisant le **slug du site comme nom d'utilisateur** pour que les fichiers atterrissent dans le bon docroot, puis `docker compose restart sftp`.

### Gérer la stack

Depuis le dossier `docker/` (l'override est câblé dans `COMPOSE_FILE`, donc un `docker compose` simple fonctionne) :

```bash
docker compose ps                 # statut
docker compose logs -f studio     # suivre les logs d'un service
docker compose down               # tout arrêter
git pull && docker compose up -d --build   # mettre à jour après un pull
```

### Dépannage

- **`docker compose: unknown shorthand flag: 'f'`** — le plugin Compose v2 manque ; le script l'installe. Correctif manuel : `apt-get install -y docker-compose-plugin`.
- **Build tué (exit 137 / OOM) ou bloqué sur « Creating an optimized production build »** — plus assez de RAM pendant `next build`. Le mieux : **ne pas builder sur le serveur** → utilise `--studio-image` (voir « Petit serveur : image pré-buildée »). Sinon, laisse le script ajouter du swap (8 Go), ou ajoute-en manuellement.
- **`apps/studio/Dockerfile missing`** — tu n'as que le dossier `docker/` ; clone le dépôt **complet** pour builder Studio, ou passe en mode `--studio-image` (qui n'a pas besoin de `apps/studio`).
- **Certificat TLS non émis** — l'enregistrement A du domaine doit pointer vers le serveur et les ports 80/443 être joignables ; en attendant, nginx sert un certificat auto-signé.
- **Connexion au dashboard impossible alors que le mot de passe semble correct** — évite `$` et `\` dans le mot de passe (Docker Compose les ré-interprète) ; le script les refuse désormais.

## Installation manuelle (guide amont)

Tu préfères tout configurer à la main, ou faire tourner la stack standard sans les ajouts du fork ? Suis le guide officiel : [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)

The guide covers:
- Prerequisites (Git and Docker)
- Initial setup and configuration
- Securing your installation
- Accessing services
- Updating your instance

## What's Included

This Docker Compose configuration includes the following services:

- **[Studio](https://github.com/supabase/supabase/tree/master/apps/studio)** - A dashboard for managing your self-hosted Supabase project
- **[Kong](https://github.com/Kong/kong)** - Kong API gateway
- **[Auth](https://github.com/supabase/auth)** - JWT-based authentication API for user sign-ups, logins, and session management
- **[PostgREST](https://github.com/PostgREST/postgrest)** - Web server that turns your PostgreSQL database directly into a RESTful API
- **[Realtime](https://github.com/supabase/realtime)** - Elixir server that listens to PostgreSQL database changes and broadcasts them over websockets
- **[Storage](https://github.com/supabase/storage)** - RESTful API for managing files in S3, with Postgres handling permissions
- **[imgproxy](https://github.com/imgproxy/imgproxy)** - Fast and secure image processing server
- **[postgres-meta](https://github.com/supabase/postgres-meta)** - RESTful API for managing Postgres (fetch tables, add roles, run queries)
- **[PostgreSQL](https://github.com/supabase/postgres)** - Object-relational database with over 30 years of active development
- **[Edge Runtime](https://github.com/supabase/edge-runtime)** - Web server based on Deno runtime for running JavaScript, TypeScript, and WASM services
- **[Logflare](https://github.com/Logflare/logflare)** - Log management and event analytics platform
- **[Vector](https://github.com/vectordotdev/vector)** - High-performance observability data pipeline for logs
- **[Supavisor](https://github.com/supabase/supavisor)** - Supabase's Postgres connection pooler

Added by this fork (web hosting / Sites, started with the one-command installer or the [nginx override](./docker-compose.nginx.yml)):

- **[nginx-certbot](https://github.com/JonasAlfredsson/docker-nginx-certbot)** - TLS-terminating reverse proxy that serves the dashboard and the hosted sites, with automatic Let's Encrypt certificates
- **hosting-agent** - small privileged sidecar ([`hosting-agent/`](./hosting-agent/)) that writes nginx server blocks and reloads nginx for the Sites feature — the only component with access to the Docker socket
- **[sftp](https://github.com/atmoz/sftp)** - chrooted SFTP access to the site docroots (optional FTPS available behind the `ftps` profile)

## Documentation

- **[Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)** - Setup and configuration guides
- **[CHANGELOG.md](./CHANGELOG.md)** - Track recent updates and changes to services
- **[versions.md](./versions.md)** - Complete history of Docker image versions for rollback reference
- **[Ask DeepWiki / Supabase](https://deepwiki.com/supabase/supabase/3-self-hosted-deployment)** - DeepWiki-generated description of self-hosted configuration
- **[CONFIG.md](./CONFIG.md)** - Configuration reference for all environment variables
- **[install.sh](./install.sh)** - Autonomous one-command installer for this fork (Sites + edge-function management)
- **[docker-compose.local.yml](./docker-compose.local.yml)** - All-in-one override: builds Studio from source + web-hosting stack

## Updates

To update your self-hosted Supabase instance:

1. Review [CHANGELOG.md](./CHANGELOG.md) for breaking changes
2. Check [versions.md](./versions.md) for new image versions
3. Update `docker-compose.yml` if there are configuration changes
4. Pull the latest images: `docker compose pull`
5. Stop services: `docker compose down`
6. Start services with new configuration: `docker compose up -d`

**Note:** Consider to always backup your database before updating.

## Community & Support

For troubleshooting common issues, see:
- [GitHub Discussions](https://github.com/orgs/supabase/discussions?discussions_q=is%3Aopen+label%3Aself-hosted) - Questions, feature requests, and workarounds
- [GitHub Issues](https://github.com/supabase/supabase/issues?q=is%3Aissue%20state%3Aopen%20label%3Aself-hosted) - Known issues
- [Documentation](https://supabase.com/docs/guides/self-hosting) - Setup and configuration guides

Self-hosted Supabase is community-supported. Get help and connect with other users:

- [Discord](https://discord.supabase.com) - Real-time chat and community support
- [Reddit](https://www.reddit.com/r/Supabase/) - Official Supabase subreddit

Share your self-hosting experience:

- [GitHub Discussions](https://github.com/orgs/supabase/discussions/39820) - "Self-hosting: What's working (and what's not)?"

## Important Notes

### Security

⚠️ **The default configuration is not secure for production use.**

Before deploying to production, you must:
- [Update](https://supabase.com/docs/guides/self-hosting/docker#configuring-and-securing-supabase) all default passwords and secrets in the `.env` file
- Review and update CORS settings
- Consider setting up a secure proxy in front of self-hosted Supabase
- Review and adjust network security configuration (ACLs, etc.)
- Set up proper backup procedures

See the [main installation guide](https://supabase.com/docs/guides/self-hosting/docker) and the how-tos in the documentation.

## License

This repository is licensed under the Apache 2.0 License. See the main [Supabase repository](https://github.com/supabase/supabase) for details.
