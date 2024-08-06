# To be run in the root of the turbo monorepo
# NOTE: It's highly recommended to use the new builder, Buildkit. https://docs.docker.com/build/buildkit/
## USAGE:
# Build:        docker build . -f apps/studio/Dockerfile --target production -t studio:latest
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker builder prune
#    docker build . -f apps/studio/Dockerfile --target production -t studio:latest --no-cache

FROM node:20-slim as base

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

WORKDIR /app

# Prune unneeded dependencies with turbo (from apps/ for example)
FROM base as turbo
COPY . .

RUN npx turbo@2.0.4 prune studio --docker

# Install dev dependencies (only if needed)
FROM base as deps
COPY --from=turbo /app/out/json ./
COPY --from=turbo /app/out/package-lock.json ./

# No need to clean cache because production uses standalone build
RUN npm clean-install

# dev contains dependencies and source code not compiled
FROM deps as dev
COPY --from=turbo /app/out/full ./
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 8082
CMD ["npm", "run", "dev:studio"]

# Compile Next.js
FROM dev as builder

RUN npx turbo@2.0.4 run build --filter studio -- --no-lint

# Copy only compiled code and dependencies
FROM base as production
COPY --from=builder /app/apps/studio/public ./apps/studio/public
COPY --from=builder /app/apps/studio/.next/standalone ./
COPY --from=builder /app/apps/studio/.next/static ./apps/studio/.next/static
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/profile').then((r) => {if (r.status !== 200) throw new Error(r.status)})"
CMD ["node", "apps/studio/server.js"]
