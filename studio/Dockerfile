## USAGE:
# Build:        docker build -t studio . 
# Run:          docker run -p 3000:3000 studio
# Clean build:  
#    docker build --no-cache -t studio . 
#    docker builder prune


FROM node:14 as base
WORKDIR /usr/src/app
COPY package*.json ./

FROM base as build
ENV NODE_ENV=build
RUN npm install
COPY . .
RUN npm run build

FROM build as dev
ENV NODE_ENV=dev
EXPOSE 8082
CMD [ "npm", "run", "dev" ]

FROM build as production
ENV NODE_ENV=production
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
