# NOTE: The `github.*` and `dev` targets that previously lived here were
# removed because they were dead code: they referenced a top-level `web/`
# directory that no longer exists (the marketing site now lives at
# `apps/www`), an `npm run traction` script that doesn't exist anywhere in
# the repo, and a `vercel-local.json` file that isn't present either.
# See: https://github.com/supabase/supabase/issues/47586
help:
	@echo "This Makefile currently has no active targets."
	@echo "See apps/www for the marketing site scripts, and the root README/DEVELOPERS.md for local dev setup."
