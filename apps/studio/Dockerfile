# To be run in the root of the turbo monorepo
# NOTE: It's highly recommended to use the new builder, Buildkit. https://docs.docker.com/build/buildkit/
## USAGE:
# Build:        docker build . -f apps/studio/Dockerfile --target production -t studio:latest
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker builder prune
#    docker build . -f apps/studio/Dockerfile --target production -t studio:latest --no-cache

FROM node:24-slim AS base
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

RUN npm install -g pnpm@11.13.1

WORKDIR /app

# Prune unneeded dependencies with turbo (from apps/ for example)
FROM base AS turbo
COPY . .

RUN pnpm dlx turbo@2.11.10 prune studio --docker

# Install dev dependencies (only if needed)
FROM base AS deps
COPY --from=turbo /app/out/json ./
COPY --from=turbo /app/out/pnpm-lock.yaml ./
COPY ./patches/ ./patches

# The production stage copies only the self-contained build output, so the
# install cache never reaches the final image.
RUN pnpm install --frozen-lockfile

# dev contains dependencies and source code not compiled
FROM deps AS dev
COPY --from=turbo /app/out/full ./
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 8082
CMD ["pnpm", "dev:studio"]

# Compile TanStack Start (Vite + Nitro)
FROM dev AS build
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter studio run build

# Assemble the runtime tree at /srv. Nitro's node-server output is
# self-contained (`.output/server` bundles the app with its traced
# dependencies, `.output/public` holds the client assets), so no node_modules
# install is needed. The server.js shim loads `.env` (container env vars win);
# package.json is copied so the shim runs as ESM.
RUN mkdir -p /srv/apps/studio && \
  cp -a apps/studio/.output /srv/apps/studio/.output && \
  cp apps/studio/package.json apps/studio/.env /srv/apps/studio/ && \
  printf "process.loadEnvFile(new URL('.env', import.meta.url))\nawait import('./.output/server/index.mjs')\n" > /srv/apps/studio/server.js

# Copy only compiled code and dependencies
FROM base AS production
COPY --from=build /srv ./
# The server reads PORT (the `start` script defaults it to 8082); pin it to
# the port the healthcheck and compose files expect.
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/platform/profile').then((r) => {if (r.status !== 200) throw new Error(r.status)})"
CMD ["node", "apps/studio/server.js"]
