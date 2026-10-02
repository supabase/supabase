# Find eligible builder and runner images on Docker Hub. We use Ubuntu/Debian instead of
# Alpine to avoid DNS resolution issues in production.
#
# https://hub.docker.com/r/hexpm/elixir/tags?page=1&name=ubuntu
# https://hub.docker.com/_/ubuntu?tab=tags
#
#
# This file is based on these images:
#
#   - https://hub.docker.com/r/hexpm/elixir/tags - for the build image
#   - https://hub.docker.com/_/debian?tab=tags&page=1&name=bullseye-20210902-slim - for the release image
#   - https://pkgs.org/ - resource for finding needed packages
#   - Ex: hexpm/elixir:1.14.0-erlang-25.0.3-debian-bullseye-20210902-slim
#
# ELIXIR_VERSION/OTP_VERSION mirror the elixir/erlang lines in .tool-versions.
# They cannot be read from that file here: BuildKit resolves the FROM below
# while parsing this file, so no RUN has executed yet and a pre-FROM ARG can
# only come from --build-arg or its literal default. Instead the builder stage
# re-reads .tool-versions and fails the build if these drift out of sync, and
# publish_docker.yml derives its build-args from .tool-versions directly.
# DEBIAN_VERSION has no .tool-versions equivalent.
ARG ELIXIR_VERSION=1.18.5
ARG OTP_VERSION=27.3.4.16
ARG DEBIAN_VERSION=trixie-20260824-slim

ARG BUILDER_IMAGE="hexpm/elixir:${ELIXIR_VERSION}-erlang-${OTP_VERSION}-debian-${DEBIAN_VERSION}"
ARG RUNNER_IMAGE="debian:${DEBIAN_VERSION}"

FROM ${BUILDER_IMAGE} as builder

# Install build dependencies
RUN apt-get update -y && apt-get install -y build-essential git curl cmake libclang-dev\
  && apt-get clean && rm -f /var/lib/apt/lists/*_*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Prepare build dir
WORKDIR /app

# Verify the base image actually carries the toolchain .tool-versions asks for.
# The ARGs above pick the image and cannot be computed from the file, so this
# is what keeps them honest: a stale ARG fails the build instead of silently
# shipping a release built on the wrong Elixir/OTP. Set to "off" when you are
# deliberately building a tag on a different toolchain than it records --
# publish_docker.yml does this whenever an explicit version override is passed.
ARG TOOL_VERSIONS_CHECK=strict
COPY .tool-versions .tool-versions
RUN set -eu; \
  if [ "$TOOL_VERSIONS_CHECK" = "off" ]; then \
    echo "TOOL_VERSIONS_CHECK=off: skipping .tool-versions verification"; \
  else \
    want_elixir="$(awk '$1=="elixir"{print $2}' .tool-versions | sed -E 's/-otp-[0-9]+$//')"; \
    want_otp="$(awk '$1=="erlang"{print $2}' .tool-versions)"; \
    have_elixir="$(elixir --short-version)"; \
    have_otp="$(cat "$(erl -noshell -eval 'io:format("~s",[code:root_dir()]),halt().')"/releases/*/OTP_VERSION | head -n1)"; \
    if [ "$want_elixir" != "$have_elixir" ] || [ "$want_otp" != "$have_otp" ]; then \
      echo "ERROR: base image toolchain does not match .tool-versions"; \
      echo "  elixir: .tool-versions wants $want_elixir, image has $have_elixir"; \
      echo "  erlang: .tool-versions wants $want_otp, image has $have_otp"; \
      echo "Update the ELIXIR_VERSION/OTP_VERSION ARGs in this Dockerfile to match,"; \
      echo "or pass --build-arg TOOL_VERSIONS_CHECK=off to build on a different toolchain."; \
      exit 1; \
    fi; \
    echo "toolchain matches .tool-versions: elixir $have_elixir, erlang $have_otp"; \
  fi

# Install hex + rebar
RUN mix local.hex --force && \
  mix local.rebar --force

# Set build ENV
ENV MIX_ENV="prod"

# Install mix dependencies
COPY mix.exs mix.lock VERSION ./
RUN mix deps.get --only $MIX_ENV
RUN mkdir config

# Copy compile-time config files
COPY config/config.exs config/${MIX_ENV}.exs config/
RUN mix deps.compile

COPY priv priv
COPY lib lib
COPY native native

# Compile the release
RUN mix compile

# Changes to config/runtime.exs don't require recompiling the code
COPY config/runtime.exs config/

COPY rel rel
RUN mix release supavisor

# Start a new build stage for the final image
FROM ${RUNNER_IMAGE}

RUN apt-get update -y && apt-get install -y libstdc++6 openssl libncurses6 locales vim curl htop postgresql-contrib sudo tini cmake libclang-dev \
  && apt-get clean && rm -f /var/lib/apt/lists/*_*

# Set the locale
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

WORKDIR "/app"
RUN chown nobody /app

# Set runner ENV
ENV MIX_ENV="prod"

# Only copy the final release from the build stage
COPY --from=builder --chown=nobody:root /app/_build/${MIX_ENV}/rel/supavisor ./

ENV RLIMIT_NOFILE 100000
COPY limits.sh /app/limits.sh
ENTRYPOINT ["/usr/bin/tini", "-s", "-g", "--", "/app/limits.sh"]

CMD ["/app/bin/server"]
# Appended by flyctl
ENV ECTO_IPV6 true
ENV ERL_AFLAGS "-proto_dist inet6_tcp"

