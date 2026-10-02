# syntax=docker/dockerfile:1.7

FROM haskell:9.10.3-bookworm AS builder
WORKDIR /src
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev zlib1g-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY cabal.project cabal.project.freeze postgrest.cabal Setup.hs ./
COPY src src
COPY vendor vendor
COPY static static
COPY docs docs
COPY test test
RUN cabal update \
    && cabal build --only-dependencies postgrest \
    && cabal build postgrest \
    && install -Dm755 "$(cabal list-bin postgrest)" /out/postgrest

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1000 --create-home --home-dir /home/postgrest postgrest
COPY --from=builder /out/postgrest /usr/local/bin/postgrest
USER postgrest
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/postgrest"]
