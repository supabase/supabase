create:
	npx create-snowpack-app sveltejs-todo --template svelte-tailwind-snowpack
sparse-checkout:
	git clone --no-checkout https://github.com/supabase/supabase
	cd supabase
	git sparse-checkout init --cone
	git sparse-checkout set examples/sveltejs-todo