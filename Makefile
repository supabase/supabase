help:
	@echo "\nDOCKER\n"
	@echo "make dev        # start docker in foreground"
	@echo "make start      # start docker in background"
	@echo "make stop       # stop docker"
	@echo "make rebuild    # restart docker and force it to rebuild"
	@echo "make pull       # pull all the latest docker images"

#########################
# Docker 
#########################

dev:
	docker-compose -f docker-compose.yml up

start:
	docker-compose -f docker-compose.yml up -d

stop:
	docker-compose -f docker-compose.yml down --remove-orphans

rebuild:
	docker-compose -f docker-compose.yml down --remove-orphans
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.yml up --force-recreate

pull:
	docker-compose -f docker-compose.yml pull
