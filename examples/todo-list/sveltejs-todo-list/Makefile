create:
	npx create-snowpack-app sveltejs-todo --template svelte-tailwind-snowpack
degit:
	npx degit supabase/supabase/examples/sveltejs-todo#190ae775096b2b789f74b35f28036809cdc25b17 supabase-sveltejs-todo
sparse-checkout:
# git version >= 2.25
	git clone --no-checkout https://github.com/supabase/supabase
	cd supabase
	git sparse-checkout init --cone
	git sparse-checkout set examples/sveltejs-todo
signup:
	node _signup.js
login:
	node _login.js
test-db:
	DEBUG= npx jest src/DB.setup.test.js 