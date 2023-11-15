# To be run in the root of the turbo monorepo
# NOTE: It's highly recommended to use the new builder, Buildkit. https://docs.docker.com/build/buildkit/
## USAGE:
# Build:        docker build . -f studio/Dockerfile --target production -t studio:latest
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker builder prune
#    docker build . -f studio/Dockerfile --target production -t studio:latest --no-cache

FROM node:18-slim as base

# Fixes issues with Sentry CLI and SSL certificates during build
RUN apt-get update -qq && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    update-ca-certificates

WORKDIR /app

# Prune unneeded dependencies with turbo (from apps/ for example)
FROM base as turbo
COPY . .

RUN npx turbo@1.10.3 prune --scope=studio --docker

# Install dev dependencies (only if needed)
FROM base as deps
COPY --from=turbo /app/out/json ./
COPY --from=turbo /app/out/package-lock.json ./
# Install additional dependencies for arm64 build (required by bufferutil)
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "arm64" ]; then \
    apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*; fi
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

RUN npx turbo run build --scope=studio --include-dependencies --no-deps

# Copy only compiled code and dependencies
FROM base as production
COPY --from=builder /app/studio/public ./studio/public
COPY --from=builder /app/studio/.next/standalone ./
COPY --from=builder /app/studio/.next/static ./studio/.next/static
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "require('http').get('http://localhost:3000/api/profile', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "studio/server.js"]
