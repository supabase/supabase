ARG DENO_VERSION=2.4.3

FROM denoland/deno:alpine-${DENO_VERSION} AS build
WORKDIR /app
COPY --chown=deno:deno . .
RUN deno task container:check
RUN mkdir -p /out \
 && deno compile \
      --allow-net \
      --allow-env \
      --allow-read=/run/secrets \
      --output /out/templates-service \
      src/server.ts

FROM denoland/deno:alpine-${DENO_VERSION} AS runtime
WORKDIR /app
ENV TEMPLATES_BIND=0.0.0.0 \
    TEMPLATES_PORT=8080 \
    MAX_BODY_BYTES=262144 \
    ENABLE_SEND=false
COPY --from=build --chown=deno:deno /out/templates-service /usr/local/bin/templates-service
USER deno
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["deno", "eval", "--allow-net=127.0.0.1:8080", "const r=await fetch('http://127.0.0.1:8080/healthz');if(!r.ok)Deno.exit(1)"]
ENTRYPOINT ["/usr/local/bin/templates-service"]
