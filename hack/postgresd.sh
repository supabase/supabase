#!/usr/bin/env bash

docker rm -f gotrue_postgresql >/dev/null 2>/dev/null || true

docker volume inspect postgres_data 2>/dev/null >/dev/null || docker volume create --name postgres_data >/dev/null

docker run --name gotrue_postgresql \
	-p 5432:5432 \
    -e POSTGRES_USER=postgres \
	-e POSTGRES_PASSWORD=root \
	-e POSTGRES_DB=postgres \
	--volume postgres_data:/var/lib/postgresql/data \
	--volume "$(pwd)"/hack/init_postgres.sql:/docker-entrypoint-initdb.d/init.sql \
	-d postgres:15
