REPO_DIR=$(shell pwd)

help:
	@echo "\SCRIPTS\n"
	@echo "make github.contributors        # pull a list of all contributors"
	@echo "make github.issues       	   # pull a list of all issue creators"
	@echo "make github.traction       	   # get a history of stargazers for our individual repos"


github.users:
	curl -sS https://api.github.com/repos/supabase/monorepo/contributors \
	| jq -r 'map_values({username: .login, avatar_url: .avatar_url}) \
	| unique \
	| sort_by(.username)' \
	> $(REPO_DIR)/web/src/data/contributors/contributors.json

github.issues:
	curl -sS https://api.github.com/repos/supabase/monorepo/issues \
	| jq -r 'map_values({username: .user.login, avatar_url: .user.avatar_url}) \
	| unique \
	| sort_by(.username)' \
	> $(REPO_DIR)/web/src/data/contributors/issues.json

.PHONY: github.traction
github.traction: \
	github.traction.monorepo \
	github.traction.realtime  \
	github.traction.schemas

github.traction.%:
	curl -sS https://api.github.com/repos/supabase/$*/stargazers \
	-H 'Accept: application/vnd.github.v3.star+json' \
	--compressed \
	| jq -r 'map_values({repo: "@supabase/$*", starred_at: .starred_at, user: { login: .user.login, id: .user.id, avatar_url: .user.avatar_url, url: .user.url }})' \
	> $(REPO_DIR)/web/src/data/stars/$*_history.json
