REPO_DIR=$(shell pwd)

run: download combine

download: supabase gotrue postgrest realtime

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

combine:
	jq -s '{ name: "Combined Specs", children: [.[0], .[1], .[2], .[3]] }' \
	$(REPO_DIR)/supabase.json \
	$(REPO_DIR)/gotrue.json \
	$(REPO_DIR)/postgrest.json \
	$(REPO_DIR)/realtime.json \
	> $(REPO_DIR)/combined.json