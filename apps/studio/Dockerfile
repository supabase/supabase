# To be run in the root of the turbo monorepo
# NOTE: It's highly recommended to use the new builder, Buildkit. https://docs.docker.com/build/buildkit/
## USAGE:
# Build (Next):     docker build . -f apps/studio/Dockerfile --target production -t studio:latest
# Build (TanStack): docker build . -f apps/studio/Dockerfile --target production -t studio:latest --build-arg STUDIO_FRAMEWORK=tanstack
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker builder prune
#    docker build . -f apps/studio/Dockerfile --target production -t studio:latest --no-cache
#
# Build with Dependency Firewall (routes all registry fetches through
# depthfirst's supply-chain-scanning npm proxy instead of the public
# registry; falls back to the public registry if omitted):
#    DF_FIREWALL_TOKEN=xxx docker build . -f apps/studio/Dockerfile --target production -t studio:latest \
#      --secret id=df_firewall_token,env=DF_FIREWALL_TOKEN

# Which framework's build ends up in the image. This is the same variable
# scripts/dispatch.js keys on for the dev/build/start scripts, so
# `--build-arg STUDIO_FRAMEWORK=tanstack` is the docker spelling of the
# switch used everywhere else. Framework selection happens at image build
# time (the two runtimes need different build outputs and dependency
# trees), not at container start.
ARG STUDIO_FRAMEWORK=next

FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Fixes issues with Sentry CLI and SSL certificates during build
# TODO: Git is added because it's needed to build libpg, remove it once they publish a binary on the S3 bucket
RUN apt-get update -qq && \
  apt-get install -y --no-install-recommends \
  git \
  python3 \
  ca-certificates \
  build-essential && \
  rm -rf /var/lib/apt/lists/* && \
  update-ca-certificates

# When a Dependency Firewall token is supplied at build time (`docker build
# --secret id=df_firewall_token,env=DF_FIREWALL_TOKEN`), route this and every
# later registry fetch through depthfirst's supply-chain-scanning npm proxy
# instead of the public registry. The token is read from a BuildKit secret
# mount (never an ARG/ENV, which bakes into `docker history` regardless of a
# later unset) and the config it writes is reverted before this RUN
# instruction ends, so the token itself never persists in the image. Every
# stage that talks to the registry repeats this same set/run/revert dance for
# the same reason — leaving the config set at the end of a layer would bake
# the token into that layer.
RUN --mount=type=secret,id=df_firewall_token \
  if [ -s /run/secrets/df_firewall_token ]; then \
  npm config set //firewall.depthfirst.com/npm/:_authToken "$(cat /run/secrets/df_firewall_token)" && \
  npm config set registry https://firewall.depthfirst.com/npm/; \
  fi && \
  npm install -g pnpm@11.13.1 && \
  if [ -s /run/secrets/df_firewall_token ]; then \
  npm config delete //firewall.depthfirst.com/npm/:_authToken && \
  npm config delete registry; \
  fi

WORKDIR /app

# Prune unneeded dependencies with turbo (from apps/ for example)
FROM base AS turbo
COPY . .

# See the Dependency Firewall comment in the base stage above.
RUN --mount=type=secret,id=df_firewall_token \
  if [ -s /run/secrets/df_firewall_token ]; then \
  pnpm config set //firewall.depthfirst.com/npm/:_authToken "$(cat /run/secrets/df_firewall_token)" && \
  pnpm config set registry https://firewall.depthfirst.com/npm/; \
  fi && \
  pnpm dlx turbo@2.9.14 prune studio --docker && \
  if [ -s /run/secrets/df_firewall_token ]; then \
  pnpm config delete //firewall.depthfirst.com/npm/:_authToken && \
  pnpm config delete registry; \
  fi

# Install dev dependencies (only if needed)
FROM base AS deps
COPY --from=turbo /app/out/json ./
COPY --from=turbo /app/out/pnpm-lock.yaml ./
COPY ./patches/ ./patches

# No need to clean cache because production uses standalone build.
# See the Dependency Firewall comment in the base stage above.
RUN --mount=type=secret,id=df_firewall_token \
  if [ -s /run/secrets/df_firewall_token ]; then \
  pnpm config set //firewall.depthfirst.com/npm/:_authToken "$(cat /run/secrets/df_firewall_token)" && \
  pnpm config set registry https://firewall.depthfirst.com/npm/; \
  fi && \
  pnpm install --frozen-lockfile && \
  if [ -s /run/secrets/df_firewall_token ]; then \
  pnpm config delete //firewall.depthfirst.com/npm/:_authToken && \
  pnpm config delete registry; \
  fi

# dev contains dependencies and source code not compiled
FROM deps AS dev
COPY --from=turbo /app/out/full ./
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 8082
CMD ["pnpm", "dev:studio"]

# Compile Next.js
FROM dev AS build-next
RUN pnpm --filter studio exec next build

# Assemble the runtime tree at /srv in the layout the production stage
# serves from: Next's self-contained standalone output is the app root,
# with the static assets and public/ laid alongside it.
RUN mkdir -p /srv && \
  cp -a apps/studio/.next/standalone/. /srv/ && \
  mkdir -p /srv/apps/studio/.next && \
  cp -a apps/studio/.next/static /srv/apps/studio/.next/static && \
  cp -a apps/studio/public /srv/apps/studio/public

# Compile TanStack Start (Vite + Nitro)
FROM dev AS build-tanstack
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter studio run build:tanstack

# Assemble the runtime tree at /srv. Nitro's node-server output is
# self-contained (`.output/server` bundles the app with its traced
# dependencies, `.output/public` holds the client assets), so no node_modules
# install is needed. The server.js shim loads `.env` (container env vars win)
# and gives the production stage one CMD for both frameworks; package.json is
# copied so the shim runs as ESM.
RUN mkdir -p /srv/apps/studio && \
  cp -a apps/studio/.output /srv/apps/studio/.output && \
  cp apps/studio/package.json apps/studio/.env /srv/apps/studio/ && \
  printf "process.loadEnvFile(new URL('.env', import.meta.url))\nawait import('./.output/server/index.mjs')\n" > /srv/apps/studio/server.js

# Alias whichever framework build was selected so the production stage can
# COPY from a single stage name. BuildKit only builds the selected branch.
FROM build-${STUDIO_FRAMEWORK} AS build

# Copy only compiled code and dependencies
FROM base AS production
COPY --from=build /srv ./
# Both servers read PORT (the TanStack `start` script defaults it to 8082);
# pin it to the port the healthcheck and compose files expect.
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/platform/profile').then((r) => {if (r.status !== 200) throw new Error(r.status)})"
CMD ["node", "apps/studio/server.js"]
