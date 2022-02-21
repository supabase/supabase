## USAGE:
# Build:        docker build --target production -t supabase/studio:latest .
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker build --target production --no-cache -t supabase/studio:latest .
#    docker builder prune


FROM node:14-slim as builder
WORKDIR /app
# Do `npm ci` separately so we can cache `node_modules`
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
COPY package*.json ./
RUN npm clean-install && npm cache clean --force
COPY . .
RUN NEXT_STANDALONE=true npm run build

# This leverages Next.js output file tracing to reduce image size:
# https://nextjs.org/docs/advanced-features/output-file-tracing
FROM node:14-slim as production
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
