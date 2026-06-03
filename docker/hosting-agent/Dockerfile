FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./

# Runs as root by design: this privileged sidecar needs to reach the Docker
# socket to send nginx a reload signal. It is bound to the internal Docker
# network only and authenticates every request with HOSTING_AGENT_TOKEN.
EXPOSE 9000

CMD ["node", "server.js"]
