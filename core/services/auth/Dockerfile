FROM golang:1.27.0-alpine3.23@sha256:3747dcba41c8b0db3211fda4db61638b980e17ac5bb3c94460a975a9cfe19395 as build
ENV GO111MODULE=on
ENV CGO_ENABLED=0
ENV GOOS=linux

RUN apk add --no-cache make git

WORKDIR /go/src/github.com/supabase/auth

# Pulling dependencies
COPY ./Makefile ./go.* ./
COPY ./internal/forks/godotenv ./internal/forks/godotenv
RUN make deps

# Building stuff
COPY . /go/src/github.com/supabase/auth

# Make sure you change the RELEASE_VERSION value before publishing an image.
RUN RELEASE_VERSION=unspecified make build

FROM alpine:3.23@sha256:fd791d74b68913cbb027c6546007b3f0d3bc45125f797758156952bc2d6daf40
RUN adduser -D -u 1000 supabase

RUN apk add --no-cache ca-certificates
COPY --from=build /go/src/github.com/supabase/auth/auth /usr/local/bin/auth
COPY --from=build /go/src/github.com/supabase/auth/migrations /usr/local/etc/auth/migrations/
RUN ln -s /usr/local/bin/auth /usr/local/bin/gotrue

ENV GOTRUE_DB_MIGRATIONS_PATH /usr/local/etc/auth/migrations

USER supabase
CMD ["auth"]
