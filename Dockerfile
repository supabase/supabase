FROM docker:28-dind

RUN apk add --no-cache \
    bash \
    ca-certificates \
    curl \
    jq \
    nodejs \
    npm \
    openssl \
    tini

WORKDIR /supabase

COPY docker/ /supabase/
COPY cranl-entrypoint.sh /usr/local/bin/cranl-entrypoint.sh

RUN chmod +x /usr/local/bin/cranl-entrypoint.sh \
    && chmod +x /supabase/run.sh /supabase/utils/*.sh

ENV DOCKER_TLS_CERTDIR="" \
    COMPOSE_FILE="docker-compose.yml:docker-compose.logs.yml:docker-compose.cranl.yml" \
    KONG_HTTP_PORT="8000" \
    KONG_HTTPS_PORT="8443" \
    REGION="saudi-arabia-1" \
    DOCKER_SOCKET_LOCATION="/var/run/docker.sock"

EXPOSE 8000

ENTRYPOINT ["tini", "--", "cranl-entrypoint.sh"]
