.PHONY: all build deps image migrate test vet sec vulncheck format hooks lint unused release
.PHONY: check-gosec check-govulncheck check-staticcheck check-go-version check-format
CHECK_FILES ?= ./...

ifdef RELEASE_VERSION
	VERSION := v$(RELEASE_VERSION)
else
	VERSION := $(shell git describe --tags 2>/dev/null)
endif

ifneq ($(shell docker compose version 2>/dev/null),)
	DOCKER_COMPOSE = docker compose
else
	DOCKER_COMPOSE = docker-compose
endif

DEV_DOCKER_COMPOSE = docker-compose-dev.yml

BUILD_VERSION_PKG = github.com/supabase/auth/internal/utilities
BUILD_LD_FLAGS = -X $(BUILD_VERSION_PKG).Version=$(VERSION)
BUILD_CMD = go build \
	-o $(1) \
	-buildvcs=false \
	-ldflags "$(BUILD_LD_FLAGS)$(2)"

RELEASE_TARGETS = x86 arm64 darwin-arm64 amd64-strip arm64-strip
RELEASE_ARCHIVES = \
	auth-$(VERSION)-x86.tar.gz \
	auth-$(VERSION)-arm64.tar.gz \
	auth-$(VERSION)-darwin-arm64.tar.gz \
	auth-$(VERSION)-amd64.tar.xz \
	auth-$(VERSION)-arm64.tar.xz

TOOL_BIN_DIR = tools/bin
TOOL_TARGETS = \
	$(TOOL_BIN_DIR)/gosec \
	$(TOOL_BIN_DIR)/staticcheck \
	$(TOOL_BIN_DIR)/govulncheck


help: ## Show this help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {sub("\\\\n",sprintf("\n%22c"," "), $$2);printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

all: check-go-version vet sec static build ## Run the tests and build the binary.

build: auth auth-amd64 auth-arm64 auth-darwin-arm64 ## Build the binaries.

build-strip: auth-amd64-strip auth-arm64-strip ## Build a stripped binary, for which the version file needs to be rewritten.

auth: deps
	CGO_ENABLED=0 $(call BUILD_CMD,$(@),)

auth-x86: deps
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(call BUILD_CMD,$(@),)

auth-amd64: deps
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(call BUILD_CMD,$(@),)

auth-arm64: deps
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 $(call BUILD_CMD,$(@),)

auth-darwin-arm64: deps
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 $(call BUILD_CMD,$(@),)

auth-amd64-strip: deps
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(call BUILD_CMD,$(@), -s)

auth-arm64-strip: deps
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 $(call BUILD_CMD,$(@), -s)

deps: ## Install dependencies.
	@go mod download
	@go mod verify

lint: \
	check-go-version \
	vet \
	static \
	sec \
	vulncheck

release-test: lint test

release: $(RELEASE_ARCHIVES)

auth-$(VERSION)-%.tar.gz: \
		release-%/auth \
		release-%/gotrue | migrations
	tar -C $(<D) -czvf $(@) auth gotrue -C ../ migrations/

auth-$(VERSION)-amd64.tar.xz: \
		release-amd64-strip/auth \
		release-amd64-strip/gotrue | migrations
	tar -C $(<D) -cf - auth gotrue -C ../ migrations/ \
		| xz -T0 -9e -C crc64 > $(@)

auth-$(VERSION)-arm64.tar.xz: \
		release-arm64-strip/auth \
		release-arm64-strip/gotrue | migrations
	tar -C $(<D) -cf - auth gotrue -C ../ migrations/ \
		| xz -T0 -9e -C crc64 > $(@)

release-%/auth: auth-%
	mkdir -p $(@D)
	cp -a $(<) $(@)

release-%/gotrue: release-%/auth
	ln -sf $(<F) $(@)

migrate_dev: ## Run database migrations for development.
	hack/migrate.sh postgres

migrate_test: ## Run database migrations for test.
	hack/migrate.sh postgres --verbose

test: auth ## Run tests.
	go test -failfast $(CHECK_FILES) -coverprofile=coverage.out -coverpkg ./... -p 1 -race -v -count=1
	./hack/coverage.sh

vet: # Vet the code
	go vet $(CHECK_FILES)

check-go-version: ## Verify the pinned Go version matches across go.mod, Dockerfiles, and submodules.
	./hack/check-go-version.sh

.NOTPARALLEL: $(TOOL_TARGETS)
$(TOOL_TARGETS):
	$(MAKE) -C tools

sec: | $(TOOL_BIN_DIR)/gosec # Check for security vulnerabilities
	$(TOOL_BIN_DIR)/gosec \
		-quiet \
		-exclude-generated \
		-exclude=G117,G120,G704 \
		$(CHECK_FILES)
	$(TOOL_BIN_DIR)/gosec \
		-quiet \
		-tests \
		-exclude-generated \
		-exclude=G101,G104,G117,G120,G704 \
		$(CHECK_FILES)

vulncheck: $(TOOL_BIN_DIR)/govulncheck # Check for known vulnerabilities
	$(TOOL_BIN_DIR)/govulncheck $(CHECK_FILES) | go run ./hack/vulncheck-filter

unused: | $(TOOL_BIN_DIR)/staticcheck # Look for unused code
	@echo "Unused code:"
	$(TOOL_BIN_DIR)/staticcheck -checks U1000 $(CHECK_FILES)
	@echo
	@echo "Code used only in _test.go (do move it in those files):"
	$(TOOL_BIN_DIR)/staticcheck -checks U1000 -tests=false $(CHECK_FILES)

static: | $(TOOL_BIN_DIR)/staticcheck
	$(TOOL_BIN_DIR)/staticcheck ./...

generate:
	go generate ./...

dev: ## Run the development containers
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) up

down: ## Shutdown the development containers
	# Start postgres first and apply migrations
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) down

docker-test: ## Run the tests using the development containers
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) up -d postgres
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) run auth sh -c "make migrate_test"
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) run auth sh -c "make test"
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) down -v

docker-build: ## Force a full rebuild of the development containers
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) build --no-cache
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) up -d postgres
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) run auth sh -c "make migrate_dev"
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) down

docker-clean: ## Remove the development containers and volumes
	${DOCKER_COMPOSE} -f $(DEV_DOCKER_COMPOSE) rm -fsv

format:
	gofmt -s -w .

check-format: ## Verify gofmt formatting. Pass FILES="..." to scope the check.
	@files=$$(gofmt -s -l $(or $(FILES),.)); \
	if [ -n "$$files" ]; then \
		echo "The following files are not gofmt-formatted:"; \
		echo "$$files"; \
		echo 'Run "make format" and re-stage the changes.'; \
		exit 1; \
	fi

hooks: ## Install the git hooks defined in lefthook.yml (requires: brew install lefthook).
	lefthook install
	$(MAKE) -C tools

clean:
	$(MAKE) -C tools clean
	rm -rf \
		$(addprefix release-,$(RELEASE_TARGETS)) \
		$(addprefix auth-,$(RELEASE_TARGETS)) \
		$(RELEASE_ARCHIVES) \
		auth
