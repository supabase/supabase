# To be run in the root of the turbo monorepo
# NOTE: It's highly recommended to use the new builder, Buildkit. https://docs.docker.com/build/buildkit/
## USAGE:
# Build:        docker build . -f apps/studio/Dockerfile --target production -t studio:latest
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker builder prune
#    docker build . -f apps/studio/Dockerfile --target production -t studio:latest --no-cache

FROM node:20-slim AS base
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

RUN npm install -g pnpm@9.15.5

WORKDIR /app

# Prune unneeded dependencies with turbo (from apps/ for example)
FROM base AS turbo
COPY . .

RUN pnpm dlx turbo@2.3.3 prune studio --docker

# Install dev dependencies (only if needed)
FROM base AS deps
COPY --from=turbo /app/out/json ./
COPY --from=turbo /app/out/pnpm-lock.yaml ./

# No need to clean cache because production uses standalone build
RUN pnpm install --frozen-lockfile

# dev contains dependencies and source code not compiled
FROM deps AS dev
COPY --from=turbo /app/out/full ./
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 8082
CMD ["pnpm", "dev:studio"]

# Compile Next.js
FROM dev AS builder

RUN pnpm dlx turbo@2.3.3 run build --filter studio -- --no-lint

# Copy only compiled code and dependencies
FROM base AS production
COPY --from=builder /app/apps/studio/public ./apps/studio/public
COPY --from=builder /app/apps/studio/.next/standalone ./
COPY --from=builder /app/apps/studio/.next/static ./apps/studio/.next/static
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/platform/profile').then((r) => {if (r.status !== 200) throw new Error(r.status)})"
CMD ["node", "apps/studio/server.js"]
