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

RUN npm install -g pnpm@11.13.1

WORKDIR /app

# Prune unneeded dependencies with turbo (from apps/ for example)
FROM base AS turbo
COPY . .

RUN pnpm dlx turbo@2.9.14 prune studio --docker

# Install dev dependencies (only if needed)
FROM base AS deps
COPY --from=turbo /app/out/json ./
COPY --from=turbo /app/out/pnpm-lock.yaml ./
COPY ./patches/ ./patches

# No need to clean cache because production uses standalone build
RUN pnpm install --frozen-lockfile

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

# Compile TanStack Start (Vite)
FROM dev AS build-tanstack
# build:tanstack = vite build --mode production, then a smoke test that
# boots the server bundle so module-scope crashes fail the image build.
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter studio run build:tanstack

# Assemble the runtime tree at /srv. Unlike Next's standalone output, the
# Vite SSR bundle externalizes studio's dependencies and resolves them from
# node_modules at request time, so the tree is a prod-only `pnpm deploy` of
# studio (node_modules + manifest) plus the built dist/ and the runtime
# scripts. `scripts/serve.js` is the HTTP server (the same entry
# start:tanstack uses); the server.js shim gives the production stage a
# single CMD that works for both frameworks. `.env` is kept because
# serve.js loads it as the base of the runtime env cascade (container env
# vars always win over file values).
#
# --ignore-scripts: pnpm 11 hard-errors (ERR_PNPM_IGNORED_BUILDS) on
# dependency build scripts without an allowBuilds entry, and deploy turns
# the workspace packages into file: deps whose `only-allow pnpm` preinstall
# guards trip it. No lifecycle script is needed here anyway: the tree is
# fully prebuilt, and nothing in studio's prod graph is approved to build
# (allowBuilds only permits node-pty and supabase, both dev-only).
RUN pnpm --filter studio deploy --prod --legacy --ignore-scripts /srv/apps/studio && \
  cd /srv/apps/studio && \
  find . -mindepth 1 -maxdepth 1 \
  ! -name node_modules ! -name package.json ! -name scripts \
  ! -name instrument.server.mjs ! -name .env \
  -exec rm -rf {} + && \
  cp -a /app/apps/studio/dist ./dist && \
  printf "import('./scripts/serve.js')\n" > server.js

# Boot the pruned tree exactly the way the container will run it, so a
# dependency that's runtime-imported but missing from `dependencies`
# (present only in devDependencies) fails the build here instead of
# 500ing the deployed container.
RUN cd /srv/apps/studio && node scripts/smoke-server.mjs

# Alias whichever framework build was selected so the production stage can
# COPY from a single stage name. BuildKit only builds the selected branch.
FROM build-${STUDIO_FRAMEWORK} AS build

# Copy only compiled code and dependencies
FROM base AS production
COPY --from=build /srv ./
# serve.js (TanStack) defaults to port 8082; pin both servers to the port
# the healthcheck and compose files expect. Next's server.js reads PORT too.
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/platform/profile').then((r) => {if (r.status !== 200) throw new Error(r.status)})"
CMD ["node", "apps/studio/server.js"]
