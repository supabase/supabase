# syntax=docker/dockerfile:1.7

# ---- build ------------------------------------------------------------------
FROM golang:1.22-alpine AS build
WORKDIR /src
ENV CGO_ENABLED=0 GOOS=linux GOFLAGS="-trimpath -mod=mod"

COPY go.mod ./
COPY main.go ./

# Reproducible static binary, no debug info, stdlib only (no `go mod download`
# step needed because there are no external requires in go.mod).
RUN go build -ldflags="-s -w" -o /out/gotrue-deep-probe .

# ---- runtime ----------------------------------------------------------------
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/gotrue-deep-probe /usr/local/bin/gotrue-deep-probe

USER nonroot:nonroot
ENV PROBE_LISTEN_ADDR=":9101" \
    PROBE_INTERVAL="10s" \
    PROBE_TIMEOUT="3s" \
    PROBE_WATCHDOG_STALL="30s" \
    PROBE_LOG_LEVEL="INFO"

EXPOSE 9101
ENTRYPOINT ["/usr/local/bin/gotrue-deep-probe"]
