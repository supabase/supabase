# Runner for /test-the-docs: executes MDX fences inside the container.
FROM node:22-bookworm-slim

ARG TARGETARCH
ARG SUPABASE_CLI_VERSION=2.39.2

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Docker CLI only (daemon is DinD over TCP for stack profile)
COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker

RUN set -eux; \
    arch="${TARGETARCH}"; \
    case "${arch}" in \
      amd64) cli_arch=amd64 ;; \
      arm64) cli_arch=arm64 ;; \
      *) cli_arch=amd64 ;; \
    esac; \
    curl -fsSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}/supabase_linux_${cli_arch}.tar.gz" \
      | tar -xz -C /usr/local/bin supabase; \
    chmod +x /usr/local/bin/supabase; \
    supabase --version

RUN useradd --create-home --uid 1001 --shell /bin/bash runner \
    && mkdir -p /work /output /examples \
    && chown -R runner:runner /work /output /examples

USER runner
WORKDIR /work
CMD ["bash"]
