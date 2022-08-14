REPO_DIR=$(shell pwd)

run: download.api.v1 download.tsdoc.v1 format

format:
	npx prettier --write .

download.api.v1:
	curl -sS https://api.supabase.com/api/v1-json > $(REPO_DIR)/api_v0_openapi.json

download.tsdoc.v1:
	curl -sS https://supabase.github.io/supabase-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/supabase.json

	curl -sS https://supabase.github.io/gotrue-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/gotrue.json

	curl -sS https://supabase.github.io/postgrest-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/postgrest.json

	curl -sS https://supabase.github.io/realtime-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/realtime.json

	curl -sS https://supabase.github.io/storage-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/storage.json

	curl -sS https://supabase.github.io/functions-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/functions.json