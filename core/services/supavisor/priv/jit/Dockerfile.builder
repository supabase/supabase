FROM ubuntu:24.04 as builder

ARG TARGETARCH

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libpam0g-dev \
    curl \
    tar \
    && rm -rf /var/lib/apt/lists/*

# Verify pam_modules.h exists
RUN test -f /usr/include/security/pam_modules.h

RUN curl -fsSL https://go.dev/dl/go1.24.5.linux-${TARGETARCH}.tar.gz -o /tmp/go.tar.gz \
    && tar -C /usr/local -xzf /tmp/go.tar.gz \
    && rm /tmp/go.tar.gz

ENV PATH="/usr/local/go/bin:${PATH}"

WORKDIR /src

RUN git clone https://github.com/supabase/jit-db-gatekeeper

WORKDIR /src/jit-db-gatekeeper

ENV CGO_ENABLED=1 \
    GOOS=linux \
    GOARCH=arm64

RUN go mod tidy
# Build the shared object using musl-gcc to get static libc linking as much as possible
RUN go build -buildmode=c-shared -o pam_jit_pg.so

RUN mkdir -p /out
RUN cp pam_jit_pg.so /out/pam_jit_pg.so

WORKDIR /out
