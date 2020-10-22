REPO_DIR=$(shell pwd)

download: supabase gotrue postgrest

supabase:
	curl -sS https://raw.githubusercontent.com/kiwicopple/supabase-js/feature/migrate_to_typescript/docs/spec.json \
	> $(REPO_DIR)/supabase.json

gotrue:
	curl -sS https://supabase.github.io/gotrue-js/spec.json \
	> $(REPO_DIR)/gotrue.json

postgrest:
	curl -sS https://supabase.github.io/postgrest-js/spec.json \
	> $(REPO_DIR)/postgrest.json

combine:
	jq -s '{ name: "Combined Specs", children: [.[0], .[1], .[2]] }' \
	$(REPO_DIR)/supabase.json \
	$(REPO_DIR)/gotrue.json \
	$(REPO_DIR)/postgrest.json \
	> $(REPO_DIR)/combined.json