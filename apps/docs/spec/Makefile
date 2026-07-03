REPO_DIR=$(shell pwd)
GENERATOR_DIR=../../../packages/generator

run: download transform generate format


###############################################################################
# Download all the specs
###############################################################################
# comment out download.auth.v1 temporarily, we're manually creating the file
# download: download.api.v1 download.auth.v1 download.storage.v1 download.tsdoc.v2
download: download.api.v1 download.storage.v1 download.tsdoc.v2 download.server.v1

download.api.v1:
	curl -sS https://api.supabase.com/api/v1-json > $(REPO_DIR)/api_v1_openapi.json
	curl -sS https://api.supabase.com/api/v2-json > $(REPO_DIR)/api_v2_openapi.json

# This flow needs to be updated, so we'l comment out for the moment
# Manual flow for now:
# — get swagger.json (https://supabase.github.io/gotrue/swagger.json)
# — manually convert via swagger editor -> open api v3 spec
# dereference.tsdoc.v2 -> auth_v1_openapi_deparsed.json

# download.auth.v1:
# 	curl -sS https://supabase.github.io/gotrue/swagger.json > $(REPO_DIR)/auth_v1_openapi.json

download.storage.v1:
	curl -sS https://supabase.github.io/storage/api.json > $(REPO_DIR)/storage_v0_openapi.json

# No longer updated
# download.tsdoc.v1:
# 	curl -sS https://supabase.github.io/supabase-js/v1/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/supabase.json
# 	curl -sS https://supabase.github.io/gotrue-js/v1/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/gotrue.json
# 	curl -sS https://supabase.github.io/postgrest-js/v1/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/postgrest.json
# 	curl -sS https://supabase.github.io/realtime-js/v1/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/realtime.json
# 	curl -sS https://supabase.github.io/storage-js/v1/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/storage.json
# 	curl -sS https://supabase.github.io/functions-js/v1/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/functions.json

download.tsdoc.v2:
	curl -sS https://supabase.github.io/supabase-js/supabase-js/v2/spec.json > $(REPO_DIR)/reference/javascript/v2/supabase.json
	curl -sS https://supabase.github.io/supabase-js/auth-js/v2/spec.json > $(REPO_DIR)/reference/javascript/v2/gotrue.json
	curl -sS https://supabase.github.io/supabase-js/postgrest-js/v2/spec.json > $(REPO_DIR)/reference/javascript/v2/postgrest.json
	curl -sS https://supabase.github.io/supabase-js/realtime-js/v2/spec.json > $(REPO_DIR)/reference/javascript/v2/realtime.json
	curl -sS https://supabase.github.io/supabase-js/storage-js/v2/spec.json > $(REPO_DIR)/reference/javascript/v2/storage.json
	curl -sS https://supabase.github.io/supabase-js/functions-js/v2/spec.json > $(REPO_DIR)/reference/javascript/v2/functions.json

download.server.v1:
	curl -sS https://supabase.github.io/server/spec.json > $(REPO_DIR)/reference/server/v1/server.json

download.analytics.v0:
	curl -sS https://logflare.app/api/openapi > $(REPO_DIR)/analytics_v0_openapi.json

###############################################################################
# Transform docs into working files
###############################################################################
# `download.tsdoc.v2` now writes raw TypeDoc JSON directly under
# `reference/javascript/v2/` — the new pipeline (`scripts/build-reference-content.ts`,
# wired into `predev`/`prebuild` via `codegen:references:new`) walks those files
# at build time, so no separate `dereference` / `combine` step is needed.
transform: dereference.api.v1 dereference.auth.v1 dereference.storage.v0

dereference.api.v1:
	pnpm exec redocly bundle --dereferenced -o $(REPO_DIR)/transforms/api_v1_openapi_deparsed.json $(REPO_DIR)/api_v1_openapi.json
	pnpm exec redocly bundle --dereferenced -o $(REPO_DIR)/transforms/api_v2_openapi_deparsed.json $(REPO_DIR)/api_v2_openapi.json

dereference.auth.v1:
	pnpm exec redocly bundle --dereferenced -o $(REPO_DIR)/transforms/auth_v1_openapi_deparsed.json $(REPO_DIR)/auth_v1_openapi.json

dereference.storage.v0:
	pnpm exec redocly bundle --dereferenced -o $(REPO_DIR)/transforms/storage_v0_openapi_deparsed.json $(REPO_DIR)/storage_v0_openapi.json

dereference.analytics.v0:
	pnpm exec redocly bundle --dereferenced -o $(REPO_DIR)/transforms/analytics_v0_openapi_deparsed.json $(REPO_DIR)/analytics_v0_openapi.json

###############################################################################
# Generate sections from OpenAPI 3.0
###############################################################################
generate: generate.sections.api.v1

generate.sections.api.v1:
	npx tsx $(REPO_DIR)/sections/generateMgmtApiSections.cts \
		$(REPO_DIR)/transforms/api_v1_openapi_deparsed.json \
		$(REPO_DIR)/transforms/api_v2_openapi_deparsed.json \
		$(REPO_DIR)/common-api-sections.json

###############################################################################
# Validate OpenAPI 3.0
###############################################################################

validate.analytics.v0:
	pnpm exec redocly lint --extends=minimal $(REPO_DIR)/analytics_v0_openapi.json

###############################################################################
# Format everything - easier for git to track changes.
###############################################################################
format:
	npx prettier --cache --write .
