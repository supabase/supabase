ARG ELIXIR_VERSION=1.19.5
ARG OTP_VERSION=28.5.0.4
ARG DEBIAN_VERSION=trixie-20260713-slim
ARG BUILDER_IMAGE="hexpm/elixir:${ELIXIR_VERSION}-erlang-${OTP_VERSION}-debian-${DEBIAN_VERSION}"
ARG RUNNER_IMAGE="debian:${DEBIAN_VERSION}"
# @supabase/pg-delta@1.0.0-alpha.48
ARG PG_DELTA_COMMIT=107ac3df4b889c527215d1f6a37df64b33154c16

FROM debian:${DEBIAN_VERSION} AS pgdelta-builder
ARG PG_DELTA_COMMIT
ARG BUN_VERSION=1.3.14

RUN set -eux; \
    apt-get update -y; \
    apt-get install -y --no-install-recommends curl ca-certificates unzip xz-utils; \
    curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"; \
    export PATH="/root/.bun/bin:${PATH}"; \
    mkdir -p /build && cd /build; \
    curl -fsSL "https://github.com/supabase/pg-toolbelt/archive/${PG_DELTA_COMMIT}.tar.gz" \
      | tar xz --strip-components=1; \
    bun install --frozen-lockfile --ignore-scripts; \
    cd /build/packages/pg-delta; \
    bun build --compile src/cli/main.ts --outfile /tmp/pgdelta; \
    /tmp/pgdelta --help > /dev/null; \
    xz -9 -e -T0 -c /tmp/pgdelta > /tmp/pgdelta.xz; \
    cd / && find build -path '*/@libpg-query/parser/wasm/libpg-query.wasm' > /tmp/libpg-query.txt; \
    test -s /tmp/libpg-query.txt; \
    tar -czf /tmp/libpg-query.tar.gz -T /tmp/libpg-query.txt; \
    printf '%s\n' \
      '#!/bin/sh' \
      'set -e' \
      'BIN=/app/.pgdelta-cache/pgdelta' \
      'if [ ! -x "$BIN" ]; then' \
      '  mkdir -p "$(dirname "$BIN")"' \
      '  xz -dcT0 /usr/local/share/pgdelta/pgdelta.xz > "$BIN"' \
      '  chmod +x "$BIN"' \
      'fi' \
      'exec "$BIN" "$@"' \
      > /tmp/pgdelta-wrapper; \
    chmod +x /tmp/pgdelta-wrapper; \
    rm -rf /tmp/pgdelta /tmp/libpg-query.txt /build /root/.bun /var/lib/apt/lists/*

FROM ${BUILDER_IMAGE} AS builder

ENV MIX_ENV="prod"

RUN apt-get update -y \
    && apt-get install curl -y \
    && apt-get install -y build-essential git \
    && apt-get clean

RUN set -uex; \
    apt-get update; \
    apt-get install -y ca-certificates curl gnupg; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    NODE_MAJOR=24; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list; \
    apt-get -qy update; \
    apt-get -qy install nodejs;

# prepare build dir
WORKDIR /app

# install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# install mix dependencies
COPY mix.exs mix.lock ./
COPY forum forum
RUN mix deps.get --only $MIX_ENV
RUN mkdir config

# copy compile-time config files before we compile dependencies
# to ensure any relevant config change will trigger the dependencies
# to be re-compiled.
COPY config/config.exs config/${MIX_ENV}.exs config/
RUN mix deps.compile
COPY priv priv
COPY lib lib

# install js dependencies before the rest of assets, so editing a stylesheet or a hook does not
# invalidate the install layer. `npm ci` installs exactly what the lockfile pins; `--omit=dev` keeps
# the lint/format tooling (oxlint, oxfmt) out of the image build.
COPY assets/package.json assets/package-lock.json assets/
RUN cd assets && npm ci --omit=dev

COPY assets assets

# compile assets with esbuild and tailwind
RUN mix assets.deploy

# Compile the release
RUN mix compile

# Changes to config/runtime.exs don't require recompiling the code
COPY config/runtime.exs config/
COPY rel rel
RUN mix release

# start a new build stage so that the final image will only contain
# the compiled release and other runtime necessities
FROM ${RUNNER_IMAGE}
ARG SLOT_NAME_SUFFIX

ENV SLOT_NAME_SUFFIX="${SLOT_NAME_SUFFIX}" \
    LANG="en_US.UTF-8" \
    LANGUAGE="en_US:en" \
    LC_ALL="en_US.UTF-8" \
    MIX_ENV="prod" \
    ECTO_IPV6="true" \
    ERL_AFLAGS="-proto_dist inet6_tcp"

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
      libstdc++6 openssl libncurses6 locales iptables sudo tini curl awscli jq xz-utils && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=pgdelta-builder /tmp/pgdelta.xz /usr/local/share/pgdelta/pgdelta.xz
COPY --from=pgdelta-builder /tmp/pgdelta-wrapper /usr/local/bin/pgdelta
COPY --from=pgdelta-builder /tmp/libpg-query.tar.gz /tmp/libpg-query.tar.gz
RUN tar -C / -xzf /tmp/libpg-query.tar.gz && rm /tmp/libpg-query.tar.gz

# Set the locale
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

WORKDIR "/app"

RUN chown nobody /app && mkdir -p /app/.pgdelta-cache && chown nobody /app/.pgdelta-cache

COPY --from=builder --chown=nobody:root /app/_build/${MIX_ENV}/rel/realtime ./
COPY run.sh run.sh
RUN ls -la /app

USER nobody

ENTRYPOINT ["/usr/bin/tini", "-s", "-g", "--", "/app/run.sh"]
CMD ["/app/bin/server"]
