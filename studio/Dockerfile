## USAGE:
# Build:        docker build --target production -t supabase/studio:latest . 
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:  
#    docker build --target production --no-cache -t supabase/studio:latest .
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
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
