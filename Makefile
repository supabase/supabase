REPO_DIR=$(shell pwd)

help:
	@echo "\SCRIPTS\n"
	@echo "make contributors.users        # pull a list of all contributors"
	@echo "make contributors.issues       # pull a list of all issue creators"


contributors.users:
	curl -sS https://api.github.com/repos/supabase/monorepo/contributors \
	| jq -r 'map_values({username: .login, avatar_url: .avatar_url}) \
	| unique \
	| sort_by(.username)' \
	> $(REPO_DIR)/web/src/data/contributors/contributors.json

contributors.issues:
	curl -sS https://api.github.com/repos/supabase/monorepo/issues \
	| jq -r 'map_values({username: .user.login, avatar_url: .user.avatar_url}) \
	| unique \
	| sort_by(.username)' \
	> $(REPO_DIR)/web/src/data/contributors/issues.json