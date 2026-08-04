/** Embedded AI prompt bodies keyed by `AiPrompt` `id`. */
export const aiPrompts = {
  astrojs: `Help me add Supabase to my Astro project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npm create astro@latest my-app\` to scaffold the app.
2. Run \`npm install @supabase/supabase-js @astrojs/node\`.
3. Update \`astro.config.mjs\` to enable SSR with the Node adapter.
4. Create \`.env.local\` and set \`PUBLIC_SUPABASE_URL\` and
   \`PUBLIC_SUPABASE_PUBLISHABLE_KEY\`.
5. Create \`src/lib/supabase.ts\` with a \`createServerClient()\` helper function.
6. Create \`src/pages/instruments.astro\` to query and display the instruments
   table.
7. Run \`npm run dev\` and open http://localhost:4321/instruments.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/astrojs.md`,
  'expo-react-native': `Help me add Supabase to my Expo React Native project. Create a Supabase project
at database.new and run the instruments table SQL. Then:
1. Run \`npx create-expo-app my-app --template blank-typescript\` to scaffold the
   app.
2. Run \`npx expo install @supabase/supabase-js react-native-url-polyfill
   expo-sqlite\` to install dependencies.
3. Create \`.env\` and set \`EXPO_PUBLIC_SUPABASE_URL\` and
   \`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY\`.
4. Create \`lib/supabase.ts\` to initialize the Supabase client with localStorage
   persistence.
5. Update \`App.tsx\` to fetch and display instruments using \`useEffect\` and
   \`FlatList\`.
6. Run \`npx expo start\` and scan the QR code or press \`i\`/\`a\` for simulator.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native.md`,
  flask: `Help me add Supabase to my Python Flask project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Create a project directory and activate a virtual environment with
   \`python3 -m venv venv && source venv/bin/activate\`.
2. Install dependencies with \`pip install flask supabase\`.
3. Create \`.env\` and set \`SUPABASE_URL\` and \`SUPABASE_PUBLISHABLE_KEY\`.
4. Install \`python-dotenv\` and create \`app.py\` with a Flask route that queries
   and renders the instruments table using the Supabase client.
5. Run \`python app.py\` and open http://localhost:5000.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/flask.md`,
  flutter: `Help me add Supabase to my Flutter project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`flutter create my_app\` to scaffold the app.
2. Add \`supabase_flutter: ^2.0.0\` to \`pubspec.yaml\`.
3. Initialize Supabase in \`lib/main.dart\` with your project URL and publishable
   key.
4. Replace the default app with a \`FutureBuilder\` and \`ListView\` to query and
   display the instruments table.
5. Run \`flutter run\` to start the app.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/flutter.md`,
  hono: `Help me add Supabase to my Hono project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npx supabase@latest bootstrap hono\` to scaffold the app with Supabase
   and SSR auth pre-configured.
2. Run \`npm install\` to install dependencies.
3. Copy \`.env.example\` to \`.env\`, set your Supabase URL and publishable key,
   and enable anonymous sign-ins in the Auth settings.
4. Run \`npm run dev\` and open http://localhost:5173.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/hono.md`,
  'ios-swiftui': `Help me add Supabase to my iOS SwiftUI project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Create a new iOS App project in Xcode.
2. Add the \`supabase-swift\` package via File > Add Package Dependencies using
   the GitHub URL https://github.com/supabase/supabase-swift.
3. Create \`Supabase.swift\` and initialize \`SupabaseClient\` with your project
   URL and publishable key.
4. Create \`Instrument.swift\` as a decodable struct.
5. Update \`ContentView.swift\` to fetch and display the instruments table using
   a \`task\` modifier and \`List\`.
6. Run the app with Cmd + R in Xcode.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/ios-swiftui.md`,
  kotlin: `Help me add Supabase to my Android Kotlin project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Create a new Android project in Android Studio.
2. Add the Kotlin serialization plugin, Ktor client, and Supabase BOM to
   \`build.gradle.kts\`.
3. Add \`<uses-permission android:name="android.permission.INTERNET" />\` to
   \`AndroidManifest.xml\`.
4. Initialize the Supabase client in \`MainActivity.kt\` with your project URL
   and publishable key.
5. Add a serializable \`Instrument\` data class.
6. Use \`LaunchedEffect\` and \`LazyColumn\` to fetch and display the instruments
   table.
7. Click Run in Android Studio to start the app.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/kotlin.md`,
  laravel: `Help me add Supabase to my Laravel project. Create a Supabase project at
database.new. Then:
1. Run \`composer create-project laravel/laravel example-app\` to scaffold the
   project.
2. Install Laravel Breeze with \`composer require laravel/breeze --dev &&
   php artisan breeze:install\`.
3. Copy the Session Pooler connection string from the Supabase Connect panel
   and set \`DB_URL\` in \`.env\`.
4. Set \`search_path\` to a custom schema (e.g. \`laravel\`) in
   \`config/database.php\`.
5. Run \`php artisan migrate\` to apply database migrations.
6. Run \`php artisan serve\` and open http://127.0.0.1:8000.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/laravel.md`,
  nextjs: `Help me add Supabase to my Next.js project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npx create-next-app -e with-supabase\` to scaffold the app.
2. Rename \`.env.example\` to \`.env.local\` and set \`NEXT_PUBLIC_SUPABASE_URL\` and
   \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\`.
3. Create \`app/instruments/page.tsx\` using \`createClient()\` from
   \`@/lib/supabase/server\` to query and display the instruments table.
4. Run \`npm run dev\` and open http://localhost:3000/instruments.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/nextjs.md`,
  nuxtjs: `Help me add Supabase to my Nuxt project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npx nuxi@latest init my-app\` to scaffold the app.
2. Run \`npm install @supabase/supabase-js\`.
3. Create \`.env\` with \`SUPABASE_URL\` and \`SUPABASE_PUBLISHABLE_KEY\` and expose
   them via \`nuxt.config.ts\` runtimeConfig.
4. Update \`app.vue\` to create a Supabase client and fetch and display the
   instruments table on mount.
5. Run \`npm run dev\` and open http://localhost:3000.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/nuxtjs.md`,
  reactjs: `Help me add Supabase to my React project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npm create vite@latest my-app -- --template react\` to scaffold the
   app.
2. Run \`npm install @supabase/supabase-js\`.
3. Create \`.env.local\` and set \`VITE_SUPABASE_URL\` and
   \`VITE_SUPABASE_PUBLISHABLE_KEY\`.
4. Update \`src/App.jsx\` to create a Supabase client and fetch and display the
   instruments table using \`useEffect\`.
5. Run \`npm run dev\` and open http://localhost:5173.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/reactjs.md`,
  redwoodjs: `Help me add Supabase to my RedwoodJS project. Create a Supabase project at
database.new and copy the Transaction and Session pooler connection strings.
Then:
1. Run \`yarn create redwood-app my-app --ts\` to scaffold the app.
2. Set \`DATABASE_URL\` (Transaction pooler with \`?pgbouncer=true\`) and
   \`DIRECT_URL\` (Session pooler) in \`.env\`.
3. Update \`api/db/schema.prisma\` to use the PostgreSQL datasource with those
   env vars.
4. Add an \`Instrument\` model to the Prisma schema and run \`yarn rw prisma
   migrate dev\`.
5. Update \`scripts/seed.ts\` with instrument data and run \`yarn rw prisma db
   seed\`.
6. Run \`yarn rw g scaffold instrument\` to scaffold the CRUD UI.
7. Run \`yarn rw dev\` and open http://localhost:8910/instruments.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/redwoodjs.md`,
  refine: `Help me add Supabase to my Refine project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npm create refine-app@latest -- --preset refine-supabase my-app\` to
   scaffold the app with Supabase pre-configured.
2. Update \`src/utility/supabaseClient.ts\` with your Supabase URL and publishable
   key.
3. Run \`npm run refine create-resource instruments\` to generate CRUD pages for
   the instruments table.
4. Update \`src/App.tsx\` to add routes for the instruments list, create, edit,
   and show pages.
5. Run \`npm run dev\` and open http://localhost:5173/instruments.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/refine.md`,
  'row-level-security': `Help me write secure, performant Row Level Security (RLS) policies for my
Supabase Postgres database, plus pgTAP tests that prove each policy works.
Follow these rules:
1. Enable RLS on every table in an exposed schema (typically \`public\`) before
   writing any policies: \`alter table <table> enable row level security;\`.
   Add \`alter table <table> force row level security;\` only when a table must
   also be protected from its owning role. \`force\` does not stop superusers or
   roles with \`bypassrls\`, and it breaks \`security definer\` helpers that read
   the table as its owner, so never force it on a lookup table a policy helper
   reads.
2. Grant each role only what it needs, for example
   \`grant select on <table> to anon;\`, and revoke what it should not have. RLS
   runs only after schema and table \`grant\`s let a role reach the object, so if
   access looks blocked, confirm the grants before rewriting policy logic.
3. Write one policy per operation (\`select\`, \`insert\`, \`update\`, \`delete\`) and
   always scope it with \`to authenticated\` or \`to anon\` — never leave the role
   unspecified. \`insert\` takes only \`with check\`, \`delete\` takes only \`using\`,
   and \`update\` needs both. To deny an operation, grant nothing and write no
   policy; adding another permissive policy only widens access, since policies
   for the same operation are ORed together.
4. Wrap row-invariant calls in \`select\` so Postgres caches the result per
   statement instead of running the function per row: use
   \`(select auth.uid()) = user_id\` instead of \`auth.uid() = user_id\`. Only do
   this when the result does not change based on the row data.
5. Add a btree index on every column a policy references in \`using\` or
   \`with check\` that is not already indexed, for example
   \`create index on <table> using btree (user_id);\`. A column that already
   leads a primary key or unique index does not need another one.
6. Avoid joins inside policies. Instead of joining the target table to the
   source table, select the matching rows from the target table filtered by
   \`(select auth.uid())\` and use \`in\` or \`any\` against that set.
7. When a check needs to bypass RLS on a lookup table, such as team membership
   or role checks, call a \`security definer\` function instead of joining.
   Create it in a private, non-exposed schema, declare \`set search_path = ''\`
   and schema-qualify every reference inside it, and verify \`auth.uid()\` in the
   function body.
8. Keep the equivalent filter in application queries even though policies act
   as implicit where clauses, for example \`.eq('user_id', userId)\`, so Postgres
   can build a better query plan. Mirror the branch of the policy you want, so
   a redundant filter does not drop rows the policy would allow.
9. Test every policy with pgTAP — this is the recommended way to verify RLS.
   Scaffold with \`supabase test new <name>\`, begin the file with
   \`create extension if not exists pgtap with schema extensions;\`, wrap it in
   \`begin;\`, \`select plan(<n>);\`, \`select * from finish();\`, \`rollback;\`, and
   run it with \`supabase test db\`.
10. In each test, switch roles with \`set local role authenticated;\` and
    \`set local request.jwt.claim.sub = '<user-uuid>';\`, and cover \`anon\` as
    well as \`authenticated\`. Assert both the allow and the deny case for every
    operation: \`results_eq()\` for visibility, \`lives_ok()\` for a permitted
    write, and \`throws_ok(..., '42501', ...)\` where a \`with check\` or a missing
    grant rejects the statement. A denied \`update\` or \`delete\` raises nothing,
    because \`using\` filters the rows out, so assert that it changed no rows
    instead. Use \`policies_are()\` to confirm the policy set.
11. Plain pgTAP needs no extra packages. If you want helpers like
    \`tests.create_supabase_user()\`, \`tests.authenticate_as()\`, and
    \`tests.rls_enabled()\`, install \`basejump-supabase_test_helpers\` with dbdev
    first in a \`000-setup-tests-hooks.sql\` file, since they are not part of
    pgTAP itself.

REFERENCE
https://supabase.com/docs/guides/database/postgres/row-level-security.md
https://supabase.com/docs/guides/database/functions.md
https://supabase.com/docs/guides/local-development/testing/overview.md`,
  'ruby-on-rails': `Help me add Supabase to my Ruby on Rails project. Create a Supabase project at
database.new. Then:
1. Run \`rails new blog -d=postgresql\` to scaffold a new Rails project.
2. Set \`DATABASE_URL\` to the Supabase Session Pooler connection string in
   \`.env\`.
3. Generate an Article model with \`bin/rails generate model Article
   title:string body:text\` and run \`bin/rails db:migrate\`.
4. Use \`bin/rails console\` to create and query articles.
5. Run \`bin/rails server\` and open http://127.0.0.1:3000.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/ruby-on-rails.md`,
  solidjs: `Help me add Supabase to my SolidJS project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npx degit solidjs/templates/js my-app\` to scaffold the app.
2. Run \`npm install @supabase/supabase-js\`.
3. Create \`.env.local\` and set \`VITE_SUPABASE_URL\` and
   \`VITE_SUPABASE_PUBLISHABLE_KEY\`.
4. Update \`src/App.jsx\` to create a Supabase client and fetch and display the
   instruments table using \`createResource\`.
5. Run \`npm run dev\` and open http://localhost:3000.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/solidjs.md`,
  'spring-boot': `Help me add Supabase to my Spring Boot project. Create a Supabase project at
database.new. Then:
1. Run \`curl https://start.spring.io/starter.zip -d dependencies=web,data-jpa,postgresql
   -d type=maven-project -d language=java -d groupId=com.example -d artifactId=instruments
   -d name=instruments -o instruments.zip\` and unzip it to scaffold the project.
2. Copy the JDBC connection string for the Session pooler (port 5432) from the Supabase
   Connect panel and export it as a \`SUPABASE_DB_URL\` environment variable, so the
   password stays out of source control. Set \`spring.datasource.url=\${SUPABASE_DB_URL}\`
   and \`spring.datasource.driver-class-name\` in \`application.properties\`. Avoid the
   Transaction pooler (port 6543) since Hibernate relies on prepared statements.
3. Set \`spring.jpa.hibernate.ddl-auto=update\` and
   \`spring.jpa.properties.hibernate.default_schema\` in \`application.properties\`, so
   Hibernate creates tables outside the \`public\` schema that Supabase exposes as a data API.
4. Create an \`Instrument\` JPA entity mapped to the \`instruments\` table with
   \`@Table(name = "instruments")\`, and an \`InstrumentRepository\` extending
   \`JpaRepository\`.
5. Add a \`CommandLineRunner\` bean to \`InstrumentsApplication\` that seeds the table
   with a few instruments the first time the app starts.
6. Create an \`InstrumentController\` with a \`GET /instruments\` endpoint that returns
   \`instrumentRepository.findAll()\`.
7. Run \`./mvnw spring-boot:run\` and open http://localhost:8080/instruments.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot.md`,
  sveltekit: `Help me add Supabase to my SvelteKit project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npx sv create my-app\` to scaffold the app.
2. Run \`npm install @supabase/supabase-js\`.
3. Create \`.env\` and set \`PUBLIC_SUPABASE_URL\` and
   \`PUBLIC_SUPABASE_PUBLISHABLE_KEY\`.
4. Create \`src/lib/supabaseClient.js\` to initialize the Supabase client.
5. Create \`src/routes/+page.server.js\` with a \`load\` function that fetches and
   returns the instruments table.
6. Run \`npm run dev\` and open http://localhost:5173.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/sveltekit.md`,
  tanstack: `Help me add Supabase to my TanStack Start project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npx @tanstack/cli@latest create my-app\` to scaffold the app.
2. Run \`npm install @supabase/supabase-js @supabase/ssr\`.
3. Create \`.env.local\` and set \`VITE_SUPABASE_URL\` and
   \`VITE_SUPABASE_PUBLISHABLE_KEY\`.
4. Create \`src/lib/supabase/client.ts\` and \`src/lib/supabase/server.ts\` for
   browser and server clients.
5. Update \`src/routes/index.tsx\` with a loader that queries and displays the
   instruments table using the server client.
6. Run \`npm run dev\` and open http://localhost:3000.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/tanstack.md`,
  vue: `Help me add Supabase to my Vue project. Create a Supabase project at
database.new and run the instruments table SQL. Then:
1. Run \`npm init vue@latest my-app\` to scaffold the app.
2. Run \`npm install @supabase/supabase-js\`.
3. Create \`.env.local\` and set \`VITE_SUPABASE_URL\` and
   \`VITE_SUPABASE_PUBLISHABLE_KEY\`.
4. Create \`src/lib/supabaseClient.js\` to initialize the Supabase client.
5. Update \`src/App.vue\` to fetch and display the instruments table using
   \`onMounted\`.
6. Run \`npm run dev\` and open http://localhost:5173.

REFERENCE
https://supabase.com/docs/guides/getting-started/quickstarts/vue.md`,
} as const

export type AiPromptId = keyof typeof aiPrompts
