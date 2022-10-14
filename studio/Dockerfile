## USAGE:
# Build:        docker build --target production -t supabase/studio:latest .
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker build --target production --no-cache -t supabase/studio:latest .
#    docker builder prune

FROM node:16-slim as base
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

FROM base as builder
WORKDIR /usr/src/app
COPY package*.json .
COPY turbo.json .
COPY packages packages
COPY studio studio
# the following command is still unsupported for npm // https://github.com/vercel/turborepo/issues/1830
# RUN npm i -g turbo
# RUN turbo prune --scope=studio --docker
# RUN npm clean-install && npm cache clean --force
ENTRYPOINT ["docker-entrypoint.sh"]

FROM builder as dev
COPY --from=builder /usr/src/app ./
RUN npm clean-install && npm cache clean --force
EXPOSE 8082
CMD ["npx", "turbo", "run", "dev", "--filter=studio"]

FROM builder as productionprep
WORKDIR /app
COPY --from=builder /usr/src/app ./
RUN npm clean-install \
    && npm cache clean --force \
    && npx turbo run build --scope=studio --include-dependencies --no-deps \
    && rm -rf ./studio/.next/cache/webpack \
    && npm prune --production

FROM node:16-slim as production
COPY --from=productionprep /app /app
WORKDIR /app/studio
EXPOSE 3000
CMD ["npm", "run", "start"]
