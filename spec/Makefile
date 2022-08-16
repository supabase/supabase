REPO_DIR=$(shell pwd)

run: download transform format

# Format everything - easier for git to track changes
format:
	npx prettier --write .

# Transform docs into working files
transform:
	npx swagger-cli bundle --dereference --outfile $(REPO_DIR)/transforms/api_v0_openapi_deparsed.json $(REPO_DIR)/api_v0_openapi.json
	npx swagger-cli bundle --dereference --outfile $(REPO_DIR)/transforms/storage_v0_openapi_deparsed.json $(REPO_DIR)/storage_v0_openapi.json

	cd $(REPO_DIR)/../packages/generator && npm run tsdoc:dereference:functions
	cd $(REPO_DIR)/../packages/generator && npm run tsdoc:dereference:gotrue
	cd $(REPO_DIR)/../packages/generator && npm run tsdoc:dereference:postgrest
	cd $(REPO_DIR)/../packages/generator && npm run tsdoc:dereference:realtime
	cd $(REPO_DIR)/../packages/generator && npm run tsdoc:dereference:storage
	cd $(REPO_DIR)/../packages/generator && npm run tsdoc:dereference:supabase

	jq -s '{ name: "Combined Specs", children: [.[0], .[1], .[2], .[3], .[4], .[5]] }' \
	$(REPO_DIR)/enrichments/tsdoc_v2/supabase_dereferenced.json \
	$(REPO_DIR)/enrichments/tsdoc_v2/gotrue_dereferenced.json \
	$(REPO_DIR)/enrichments/tsdoc_v2/postgrest_dereferenced.json \
	$(REPO_DIR)/enrichments/tsdoc_v2/realtime_dereferenced.json \
	$(REPO_DIR)/enrichments/tsdoc_v2/storage_dereferenced.json \
	$(REPO_DIR)/enrichments/tsdoc_v2/functions_dereferenced.json \
	> $(REPO_DIR)/enrichments/tsdoc_v2/combined.json

# Download all the specs
download: download.api.v1 download.storage.v1 download.tsdoc.v1

download.api.v1:
	curl -sS https://api.supabase.com/api/v1-json > $(REPO_DIR)/api_v0_openapi.json
	
download.storage.v1:
	curl -sS https://supabase.github.io/storage-api/api.json > $(REPO_DIR)/storage_v0_openapi.json

download.tsdoc.v1:
	curl -sS https://supabase.github.io/supabase-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/supabase.json
	curl -sS https://supabase.github.io/gotrue-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/gotrue.json
	curl -sS https://supabase.github.io/postgrest-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/postgrest.json
	curl -sS https://supabase.github.io/realtime-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/realtime.json
	curl -sS https://supabase.github.io/storage-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/storage.json
	curl -sS https://supabase.github.io/functions-js/spec.json > $(REPO_DIR)/enrichments/tsdoc_v1/functions.json

	jq -s '{ name: "Combined Specs", children: [.[0], .[1], .[2], .[3], .[4], .[5]] }' \
	$(REPO_DIR)/enrichments/tsdoc_v1/supabase.json \
	$(REPO_DIR)/enrichments/tsdoc_v1/gotrue.json \
	$(REPO_DIR)/enrichments/tsdoc_v1/postgrest.json \
	$(REPO_DIR)/enrichments/tsdoc_v1/realtime.json \
	$(REPO_DIR)/enrichments/tsdoc_v1/storage.json \
	$(REPO_DIR)/enrichments/tsdoc_v1/functions.json \
	> $(REPO_DIR)/enrichments/tsdoc_v1/combined.json
