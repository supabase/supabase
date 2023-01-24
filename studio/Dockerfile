# To be run in the root of the turbo monorepo
# NOTE: It's highly raccomended to use the new builder, Buildkit. https://docs.docker.com/build/buildkit/
## USAGE:
# Build:        docker buildx build --target production -t supabase/studio:latest .
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker buildx build --target production --no-cache -t supabase/studio:latest .
#    docker builder prune

FROM node:16-slim as base
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN npm i -g turbo

# Calculate if dependencies are outdated
FROM base as turbo
WORKDIR /app
COPY . .
# Prune unneeded dependencies with turbo (from apps/ for example)
RUN turbo prune --scope=studio --docker

# Install dev dependencies (only if needed)
FROM base as deps
WORKDIR /app
COPY --from=turbo /app/out/json/ .
COPY --from=turbo /app/out/package-lock.json ./
RUN npm clean-install && npm cache clean --force

FROM deps as deps-prod
RUN npm prune --production
# Remove packages dependencies (not needed in production)
RUN rm -rf /app/packages

# builder contains dependencies and source code not compiled
FROM deps as builder
WORKDIR /app
COPY --from=turbo /app/out/full ./
ENTRYPOINT ["docker-entrypoint.sh"]

FROM builder as dev
EXPOSE 8082
CMD ["npx", "turbo", "run", "dev", "--filter=studio"]

# Compile NextJS
FROM builder as productionprep
WORKDIR /app
RUN npx turbo run build --scope=studio --include-dependencies --no-deps \
    && rm -rf ./studio/.next/cache/webpack

# Copy only compiled code and dependencies
FROM node:16-slim as production
# Copy package(s).json and package-lock.json
COPY --from=turbo /app/out/json /app
# Copy all dependencies for production
COPY --from=deps-prod /app /app
# Copy necessary files
COPY --from=turbo /app/out/full/studio /app/studio
COPY --from=productionprep /app/studio/.next /app/studio/.next
WORKDIR /app/studio
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "require('http').get('http://localhost:3000/api/profile', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["npm", "run", "start"]
