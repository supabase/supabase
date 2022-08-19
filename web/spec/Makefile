REPO_DIR=$(shell pwd)

run: download.tsdoc.v1 combine.tsdoc.v1

download.tsdoc.v1:
	curl -sS https://supabase.github.io/supabase-js/spec.json \
	> $(REPO_DIR)/tsdoc_v1/supabase.json

	curl -sS https://supabase.github.io/gotrue-js/spec.json \
	> $(REPO_DIR)/tsdoc_v1/gotrue.json

	curl -sS https://supabase.github.io/postgrest-js/spec.json \
	> $(REPO_DIR)/tsdoc_v1/postgrest.json

	curl -sS https://supabase.github.io/realtime-js/spec.json \
	> $(REPO_DIR)/tsdoc_v1/realtime.json

	curl -sS https://supabase.github.io/storage-js/spec.json \
	> $(REPO_DIR)/tsdoc_v1/storage.json

	curl -sS https://supabase.github.io/functions-js/spec.json \
	> $(REPO_DIR)/tsdoc_v1/functions.json

combine.tsdoc.v1:
	jq -s '{ name: "Combined Specs", children: [.[0], .[1], .[2], .[3], .[4], .[5]] }' \
	$(REPO_DIR)/tsdoc_v1/supabase.json \
	$(REPO_DIR)/tsdoc_v1/gotrue.json \
	$(REPO_DIR)/tsdoc_v1/postgrest.json \
	$(REPO_DIR)/tsdoc_v1/realtime.json \
	$(REPO_DIR)/tsdoc_v1/storage.json \
	$(REPO_DIR)/tsdoc_v1/functions.json \
	> $(REPO_DIR)/tsdoc_v1/combined.json

combine.tsdoc.v2:
	jq -s '{ name: "Combined Specs", children: [.[0], .[1], .[2], .[3], .[4], .[5]] }' \
	$(REPO_DIR)/tsdoc_v2/supabase.json \
	$(REPO_DIR)/tsdoc_v2/gotrue.json \
	$(REPO_DIR)/tsdoc_v2/postgrest.json \
	$(REPO_DIR)/tsdoc_v2/realtime.json \
	$(REPO_DIR)/tsdoc_v2/storage.json \
	$(REPO_DIR)/tsdoc_v2/functions.json \
	> $(REPO_DIR)/tsdoc_v2/combined.json
