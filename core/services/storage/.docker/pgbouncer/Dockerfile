FROM edoburu/pgbouncer:v1.25.1-p0

USER root
RUN apk add --no-cache bash

COPY --chown=postgres:postgres pgbouncer.ini.template /etc/pgbouncer/pgbouncer.ini.template
COPY --chown=postgres:postgres entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 6432

USER postgres

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD printf "SHOW VERSION;\n" | nc 127.0.0.1 6432 >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
