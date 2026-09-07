# Supabase multi-database Makefile
# Working directory: docker/

.PHONY: help generate up down up-multi down-multi restart status logs add-db

help:
	@echo "Supabase multi-database targets:"
	@echo "  make generate         Regenerate docker-compose.multi.yml and .env.multi from databases.json"
	@echo "  make up               Start base Supabase stack (single database)"
	@echo "  make down             Stop base Supabase stack"
	@echo "  make up-multi         Start base + multi-database overlay"
	@echo "  make down-multi       Stop base + multi-database overlay"
	@echo "  make restart          Restart base stack"
	@echo "  make status           Show running containers"
	@echo "  make logs             Follow logs for all services"
	@echo "  make add-db           Add database to registry (requires REF, NAME, HOST, PASSWORD)"
	@echo ""
	@echo "add-db example:"
	@echo "  make add-db REF=myapp NAME='My App' HOST=db-myapp PASSWORD=secret"

generate:
	python3 generate-multi.py

up:
	docker compose --env-file .env up -d

down:
	docker compose --env-file .env down

up-multi: generate
	docker compose --env-file .env --env-file .env.multi \
		-f docker-compose.yml -f docker-compose.multi.yml up -d

down-multi:
	docker compose --env-file .env --env-file .env.multi \
		-f docker-compose.yml -f docker-compose.multi.yml down

restart: down up

status:
	docker compose --env-file .env ps

logs:
	docker compose --env-file .env logs -f

# Example: make add-db REF=myapp NAME="My App" HOST=db-myapp PASSWORD=secret JWT_SECRET=my-long-jwt-secret
add-db:
	@if [ -z "$(REF)" ] || [ -z "$(NAME)" ] || [ -z "$(HOST)" ] || [ -z "$(PASSWORD)" ]; then \
		echo "Usage: make add-db REF=<ref> NAME=<name> HOST=<host> PASSWORD=<password> [JWT_SECRET=<secret>]"; \
		exit 1; \
	fi
	cd .. && bash scripts/add-database.sh \
		--ref "$(REF)" \
		--name "$(NAME)" \
		--host "$(HOST)" \
		--password "$(PASSWORD)" \
		$(if $(JWT_SECRET),--jwt-secret "$(JWT_SECRET)",)
	@echo "Regenerating compose overlay..."
	$(MAKE) generate