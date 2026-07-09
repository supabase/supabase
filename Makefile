REPO_DIR=$(shell pwd)
WWW_DIR=$(REPO_DIR)/apps/www

.PHONY: help
help:
	@echo "\SCRIPTS\n"
	@echo "make github.contributors  	# pull a list of all contributors"
	@echo "make github.issues			# pull a list of all issue creators"
	@echo "make github.repos			# pull a list of our repos"
	@echo "make github.traction			# get a history of stargazers for our individual repos"

.PHONY: github.contributors.%
github.contributors.%:
	@mkdir -p $(WWW_DIR)/data/contributors
	curl -sS https://api.github.com/repos/supabase/$*/contributors \
	| jq -r 'map_values({ username: .login }) \
	| unique \
	| sort_by(.username)' \
	> $(WWW_DIR)/data/contributors/$*.json

.PHONY: github.contributors
github.contributors: \
	github.contributors.supabase \
	github.contributors.supabase-js \
	github.contributors.supabase-py \
	github.contributors.supabase-flutter \
	github.contributors.supabase-dart

.PHONY: github.issues
github.issues:
	@mkdir -p $(WWW_DIR)/data/contributors
	curl -sS https://api.github.com/repos/supabase/supabase/issues \
	| jq -r 'map_values({username: .user.login, avatar_url: .user.avatar_url}) \
	| unique \
	| sort_by(.username)' \
	> $(WWW_DIR)/data/contributors/issues.json

.PHONY: github.repos
github.repos: \
	github.repos.supabase \
	github.repos.realtime  \
	github.repos.postgres \
	github.repos.postgres-meta

.PHONY: github.repos.%
github.repos.%:
	@mkdir -p $(WWW_DIR)/data/repos
	curl -sS https://api.github.com/repos/supabase/$* \
	> $(WWW_DIR)/data/repos/$*.json

.PHONY: github.traction
github.traction:
	cd "$(WWW_DIR)" && \
	npm run traction

.PHONY: dev
dev:
	vercel dev --listen 8080 --local-config vercel-local.json
