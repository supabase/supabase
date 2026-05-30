# syntax=docker/dockerfile:1.6
#
# freezekit-sidecar
#
# Stdlib-only Go binary that runs as a Kubernetes sidecar next to
# an unmodified GoTrue container and captures forensic state when
# the auth service freezes.

FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /out/freezekit-sidecar .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/freezekit-sidecar /freezekit-sidecar
USER nonroot:nonroot
EXPOSE 9101
ENTRYPOINT ["/freezekit-sidecar"]
