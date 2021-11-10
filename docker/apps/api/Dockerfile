# FROM node:14-alpine as base
#     WORKDIR /src
#     COPY package*.json /
#     EXPOSE 8080

# FROM base as production
#     ENV NODE_ENV=production
#     RUN npm ci
#     COPY . /
#     CMD ["npm", "start"]

# FROM base as local
#     ENV NODE_ENV=local
#     RUN npm install
#     COPY . /
#     CMD ["npm", "run", "dev"]

FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 8080

CMD [ "npm", "run", "start" ]
