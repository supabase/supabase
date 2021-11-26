# Extermely simple setup - should be optimized before sending
# to docker hub

## USAGE:
# docker build -t next .
# docker run -p 3010:3000 next

FROM node:16

RUN mkdir -p /home/app/ && chown -R node:node /home/app
WORKDIR /home/app
COPY --chown=node:node . .

# Sometimes need this for the pg-parser
# RUN apk add --no-cache python build-base gcc g++ libpq

USER node

# Can change to "npm ci" eventually
RUN npm install 
RUN npm run build

EXPOSE 8082
CMD [ "npm", "start" ]
