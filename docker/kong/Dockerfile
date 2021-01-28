FROM kong:2.0.1

COPY kong.yml /var/lib/kong/kong.yml  

# Build time defaults
ARG build_KONG_DATABASE=off 
ARG build_KONG_PLUGINS=request-transformer,cors,key-auth
ARG build_KONG_DECLARATIVE_CONFIG=/var/lib/kong/kong.yml

# Run time values
ENV KONG_DATABASE=$build_KONG_DATABASE 
ENV KONG_PLUGINS=$build_KONG_PLUGINS
ENV KONG_DECLARATIVE_CONFIG=$build_KONG_DECLARATIVE_CONFIG

EXPOSE 8000
