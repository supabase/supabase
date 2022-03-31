REPO_DIR=$(shell pwd)

run: download combine

download: supabase gotrue postgrest realtime storage functions

supabase:
	curl -sS https://supabase.github.io/supabase-js/spec.json \
	> $(REPO_DIR)/supabase.json

gotrue:
	curl -sS https://supabase.github.io/gotrue-js/spec.json \
	> $(REPO_DIR)/gotrue.json

postgrest:
	curl -sS https://supabase.github.io/postgrest-js/spec.json \
	> $(REPO_DIR)/postgrest.json

realtime:
	curl -sS https://supabase.github.io/realtime-js/spec.json \
	> $(REPO_DIR)/realtime.json

storage:
	curl -sS https://supabase.github.io/storage-js/spec.json \
	> $(REPO_DIR)/storage.json

functions:
	curl -sS https://supabase.github.io/functions-js/spec.json \
	> $(REPO_DIR)/functions.json

combine:
	jq -s '{ name: "Combined Specs", children: [.[0], .[1], .[2], .[3], .[4], .[5]] }' \
	$(REPO_DIR)/supabase.json \
	$(REPO_DIR)/gotrue.json \
	$(REPO_DIR)/postgrest.json \
	$(REPO_DIR)/realtime.json \
	$(REPO_DIR)/storage.json \
	$(REPO_DIR)/functions.json \
	> $(REPO_DIR)/combined.json
