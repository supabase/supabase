FROM node:16 as base
    WORKDIR /usr/src/app
    COPY package*.json ./
    EXPOSE 8080

FROM base as build
    ENV NODE_ENV=build
    RUN npm install
    COPY . .
    RUN npm run build

FROM build as dev
    ENV NODE_ENV=dev
    CMD [ "npm", "run", "dev" ]

FROM build as production
    ENV NODE_ENV=production
    RUN npm ci
    COPY . .
    CMD ["npm", "start"]
