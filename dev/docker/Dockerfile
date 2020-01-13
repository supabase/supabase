FROM supabase/realtime:latest

ARG POSTGREST_VERSION="v6.0.2"
ENV DB_HOST=localhost \
    DB_NAME=postgres \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    DB_PORT=5432 \
    PGRST_DB_URI= \
    PGRST_DB_SCHEMA=public \
    PGRST_DB_ANON_ROLE= \
    PGRST_DB_POOL=100 \
    PGRST_DB_EXTRA_SEARCH_PATH=public \
    PGRST_SERVER_HOST=*4 \
    PGRST_SERVER_PORT=3000 \
    PGRST_SERVER_PROXY_URI= \
    PGRST_JWT_SECRET= \
    PGRST_SECRET_IS_BASE64=false \
    PGRST_JWT_AUD= \
    PGRST_MAX_ROWS= \
    PGRST_PRE_REQUEST= \
    PGRST_ROLE_CLAIM_KEY=".role" \
    PGRST_ROOT_SPEC= \
    PGRST_RAW_MEDIA_TYPES=

RUN apt-get update

# Install libpq5
RUN apt-get -qq install -y --no-install-recommends libpq5 && \
    apt-get -qq clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install postgrest
RUN BUILD_DEPS="curl ca-certificates xz-utils" && \
    apt-get -qq update && \
    apt-get -qq install -y --no-install-recommends $BUILD_DEPS && \
    cd /tmp && \
    curl -SLO https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}/postgrest-${POSTGREST_VERSION}-ubuntu.tar.xz && \
    tar -xJvf postgrest-${POSTGREST_VERSION}-ubuntu.tar.xz && \
    mv postgrest /usr/local/bin/postgrest && \
    cd / && \
    apt-get -qq purge --auto-remove -y $BUILD_DEPS && \
    apt-get -qq clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY postgrest.conf /etc/postgrest.conf

RUN groupadd -g 1000 postgrest && \
    useradd -r -u 1000 -g postgrest postgrest && \
    chown postgrest:postgrest /etc/postgrest.conf

# Add user to Realtime
RUN chown -R postgrest:postgrest /prod/rel/realtime/

ADD start.sh /
RUN chmod +x /start.sh

USER 1000

EXPOSE 3000
EXPOSE 4000

CMD ["/start.sh"]

# PostgREST reads /etc/postgrest.conf so map the configuration
# file in when you run this container
# CMD exec postgrest /etc/postgrest.conf
# CMD ["sh", "-c", "/prod/rel/realtime/bin/realtime start ; exec postgrest /etc/postgrest.conf"]

# docker build . -t supabase --pull --no-cache