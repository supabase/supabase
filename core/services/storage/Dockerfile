# syntax=docker/dockerfile:1
# Base stage for shared environment setup
FROM node:24-alpine3.23 AS base
RUN apk add --no-cache g++ make python3
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/ensure-npm-version.cjs ./scripts/ensure-npm-version.cjs
# The optional `npmrc` build secret lets CI route registry traffic through a
# different registry layer.
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc node scripts/ensure-npm-version.cjs

# Dependencies stage - install and cache all dependencies
FROM base AS dependencies
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --ignore-scripts
# Native addons can use the Node headers already included in the image.
RUN --network=none npm_package_config_node_gyp_nodedir=/usr/local npm rebuild
# Cache the installed node_modules for later stages
RUN cp -R node_modules /node_modules_cache

# Build stage - use cached node_modules for building the application
FROM base AS build
COPY --from=dependencies /node_modules_cache ./node_modules
COPY . .
RUN npm run build

# Production dependencies stage - prune dev dependencies from cached node_modules
FROM base AS production-deps
COPY --from=dependencies /node_modules_cache ./node_modules
# Use npm prune to remove dev dependencies while keeping compiled native modules
# Remove dev dependencies and keep native modules without downloading replacements or running scripts.
RUN --network=none npm prune --omit=dev --offline --ignore-scripts

# Final stage - for the production build
FROM base AS final
ARG VERSION
ENV VERSION=$VERSION
COPY migrations migrations

# Copy production node_modules from the production dependencies stage
COPY --from=production-deps /app/node_modules node_modules
# Copy build artifacts from the build stage
COPY --from=build /app/dist dist
COPY --from=build /app/watt.json /app
COPY --from=build /app/watt.storage.json /app

EXPOSE 5000
CMD ["node", "dist/start/server.js"]
