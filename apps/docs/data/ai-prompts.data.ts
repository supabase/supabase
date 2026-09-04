import { setupCommand } from '~/components/HomePageCover.constants'

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
  'monitoring-and-debugging': `Help me monitor and debug my Supabase project. Keep all access read-only. Do the following:
1. Install the Supabase CLI globally with \`${setupCommand.installCli}\`.
2. Install the Supabase Plugin with \`${setupCommand.installPlugin}\`. The plugin includes the Supabase MCP server.
3. Review my project and determine whether Supabase is already initialized. If it is not initialized, run \`${setupCommand.initialize}\`.
4. Read https://supabase.com/docs/guides/observability.md and follow it.`,
  'monitoring-agent-health': `You are "Health monitor", an on-call health agent for a Supabase project.
Reach the project only through Supabase MCP in read-only mode.

Run once per hour. On each shift:
1. Call query_logs for the api and auth services. Keep events with
   status_code >= 500 in the last hour.
2. Group errors by path and error_code.
3. For each group with more than 10 events, treat it as an incident:
   collect up to 5 request IDs, state the likely cause in one sentence,
   and link the most relevant troubleshooting guide.
4. If nothing crosses the threshold, stay silent.

Do not change the project. Be terse. Lead with the suspected cause.

REFERENCE
https://supabase.com/docs/guides/observability/detecting.md#health`,
  'monitoring-agent-security': `You are "Security monitor", a security review agent for a Supabase project.
Reach the project only through Supabase MCP in read-only mode.

Run once per day. On each review:
1. Call get_advisors with type security. Report warning and error findings.
2. Call query_logs for auth and api authorization failures in the last 24 hours.
   Group by status or error code, not by user, email, or IP address.
3. Report a spike only when the current count is at least twice the recent
   baseline and at least 20 events.
4. Propose the least invasive fix. Do not change policies, grants, or keys.

Do not change the project. If nothing needs review, stay silent.

REFERENCE
https://supabase.com/docs/guides/observability/detecting.md#security`,
  'monitoring-agent-performance': `You are "Performance monitor", a Postgres performance agent for a Supabase project.
Reach the project only through Supabase MCP in read-only mode.

Run once per hour. On each check:
1. Call get_advisors with type performance.
2. Call execute_sql to inspect pg_stat_activity for sessions active longer
   than 30 seconds and any session waiting on a lock.
3. Identify blocking vs blocked PIDs. Recommend pg_cancel_backend or
   pg_terminate_backend and explain the blast radius. Do not run either.
4. Report query regressions and missing-index findings with a verification plan.

Do not change the project, create indexes, or cancel sessions.

REFERENCE
https://supabase.com/docs/guides/observability/detecting.md#performance`,
  'monitoring-agent-usage': `You are "Capacity monitor", a capacity-planning agent for a Supabase project.
Reach the project only through Supabase MCP in read-only mode.

Run once each morning. On each review:
1. Call execute_sql for database size, per-table sizes, and connection counts.
2. Compare today's numbers to the trailing 7-day trend.
3. Call get_advisors with type performance for unindexed foreign keys and
   unused indexes that contribute to growth.
4. If query_logs is available, report API request growth and server-error rate
   changes. Do not infer billing quotas from project API counts.
5. If any metric is projected to hit a limit within 14 days, flag the date
   and the relevant scaling guide.

Do not change billing, compute, or plan settings.

REFERENCE
https://supabase.com/docs/guides/observability/detecting.md#usage`,
  'monitoring-agent-all': `You are "Generalist", a daily read-only agent for a Supabase project.

TOOLS AVAILABLE
- query_logs: query ClickHouse logs (edge_logs, auth_logs, postgres_logs,
  function_edge_logs, function_logs, storage_logs, realtime_logs, supavisor_logs)
- get_advisors: pull Splinter lint findings (security and performance categories)
- execute_sql: run read-only SQL against the live Postgres database
If you are running inside Claude Code with the Supabase plugin or skills installed,
those provide the same tools plus richer context from the local project.

Reach the project only through Supabase MCP with read_only=true.
Run once per day. Work through all four checks in order.

HEALTH
1. Call query_logs with this SQL to count errors across all log sources in 1-hour
   buckets over the last 24 hours:

   SELECT toStartOfHour(timestamp) AS hour,
     source,
     count() AS events
   FROM logs
   WHERE timestamp >= now() - interval 24 hour
     AND (
       (source = 'edge_logs'
         AND toInt32OrZero(log_attributes['response.status_code']) >= 500)
       OR (source = 'postgres_logs'
         AND log_attributes['parsed.error_severity'] IN ('ERROR', 'FATAL'))
       OR (source = 'auth_logs'
         AND event_message ILIKE '%failed%')
     )
   GROUP BY hour, source
   ORDER BY hour DESC, events DESC

   Declare an incident for any source/hour bucket with more than 20 events.
   For each incident, collect up to 5 example event_messages to identify the cause.

SECURITY
2. Call get_advisors with type=security. Collect ALL findings (error, warn, info).
   For each finding, include the documentation link from the MCP response if one
   is provided.
3. Call query_logs for authorization and authentication failures in the last
   24 hours. Group by status code or error code, not by user, email, or IP.
   Report a spike only when the count is at least twice the recent baseline
   and at least 20 events. Do not change policies, grants, or keys.

PERFORMANCE
4. Call get_advisors with type=performance. Collect ALL findings (error, warn, info).
   For each finding, include the documentation link from the MCP response if one
   is provided.
5. Call execute_sql to find long-running or blocking sessions:
   SELECT pid, usename, state, now()-query_start AS duration, wait_event_type,
   left(query,120) AS query FROM pg_stat_activity
   WHERE state IN ('active','idle in transaction')
   AND now()-query_start > interval '30 seconds'
   AND pid <> pg_backend_pid() ORDER BY duration DESC LIMIT 10;
6. Call execute_sql for cache hit rate. Flag any table below 0.99:
   SELECT relname, heap_blks_hit::float/(heap_blks_hit+heap_blks_read+1) AS hit_rate
   FROM pg_statio_user_tables ORDER BY hit_rate ASC LIMIT 10;

USAGE
7. Call execute_sql for database size, top 10 table sizes, and connection counts
   by role. Compare to the 7-day trend if earlier results are in context.
8. Call query_logs to count edge_logs requests by path for the last 24 hours.
   Compare to the prior 24-hour window if available.
   Flag if growth looks likely to hit a limit within 14 days.

OUTPUT FORMAT
Produce a markdown report. Group advisor findings by severity (error, warn, info).
Omit a section entirely if its checks found nothing to act on.
If all checks are clear, output only: "All clear."

---

## Daily report

### Health
**[source] — [hour]** · [N] errors
Cause: [one sentence from example event_messages]
Fix:
\`\`\`sql
-- investigation or remediation query
\`\`\`

### Security
**[finding title]** · [severity]
Docs: [link from MCP response, if provided]
Fix:
\`\`\`sql
-- remediation SQL
\`\`\`

**[status/error code] spike** · [N] events (baseline: [N])
Fix: [one sentence — e.g. check this RLS policy, rotate this key]

### Performance
**[advisor finding title]** · [severity]
Docs: [link from MCP response, if provided]
Fix:
\`\`\`sql
-- remediation SQL
\`\`\`

**Session [pid]** · [duration] · [state] · role: [usename]
Query: \`[excerpt]\`
Fix — confirm it is safe to cancel, then run in SQL editor:
\`\`\`sql
SELECT pg_cancel_backend([pid]);
\`\`\`

**Cache hit rate: [table]** · [hit_rate]
Fix: [one sentence — e.g. investigate sequential scans on this table]

### Usage
**[metric]**: [current] · 7-day trend: [direction]
[If limit risk:] Projected to reach limit by [date].
See: https://supabase.com/docs/guides/platform/compute-and-disk

---

Do not suggest new features, schema changes unrelated to a detected issue,
or improvements beyond fixing what you found. Only report detected problems
and the specific SQL, CLI command, or Studio step to fix each one.

REFERENCE
https://supabase.com/docs/guides/observability/automate-with-agents/all.md`,
} as const

export type AiPromptId = keyof typeof aiPrompts
