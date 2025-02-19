import { tool } from 'ai'
import { stripIndent } from 'common-tags'
import { z } from 'zod'

import { processSql, renderSupabaseJs } from '@supabase/sql-to-rest'
import { getDatabaseFunctions } from 'data/database-functions/database-functions-query'
import { getDatabasePolicies } from 'data/database-policies/database-policies-query'
import { getEntityDefinitionsSql } from 'data/database/entity-definitions-query'
import { executeSql } from 'data/sql/execute-sql-query'

export const getTools = ({
  projectRef,
  connectionString,
  cookie,
  authorization,
  includeSchemaMetadata,
}: {
  projectRef: string
  connectionString: string
  cookie?: string
  authorization?: string
  includeSchemaMetadata: boolean
}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(cookie && { cookie }),
    ...(authorization && { Authorization: authorization }),
  }

  return {
    getSchema: tool({
      description: 'Get more information about one or more schemas',
      parameters: z.object({
        schemas: z.array(z.string()).describe('The schema names to get the definitions for'),
      }),
      execute: async ({ schemas }) => {
        try {
          const result = includeSchemaMetadata
            ? await executeSql(
                {
                  projectRef,
                  connectionString,
                  sql: getEntityDefinitionsSql({ schemas }),
                },
                undefined,
                headers
              )
            : { result: [] }

          return result
        } catch (error) {
          console.error('Failed to execute SQL:', error)
          return `Failed to fetch schema: ${error}`
        }
      },
    }),
    convertSqlToSupabaseJs: tool({
      description: 'Convert an sql query into supabase-js client code',
      parameters: z.object({
        sql: z
          .string()
          .describe(
            'The sql statement to convert. Only a subset of statements are supported currently. '
          ),
      }),
      execute: async ({ sql }) => {
        try {
          const statement = await processSql(sql)
          const { code } = await renderSupabaseJs(statement)
          return code
        } catch (error) {
          return `Failed to convert SQL: ${error}`
        }
      },
    }),
    getRlsKnowledge: tool({
      description:
        'Get existing policies and examples and instructions on how to write RLS policies',
      parameters: z.object({
        schemas: z.array(z.string()).describe('The schema names to get the policies for'),
      }),
      execute: async ({ schemas }) => {
        const data = includeSchemaMetadata
          ? await getDatabasePolicies(
              {
                projectRef,
                connectionString,
              },
              undefined,
              headers
            )
          : []

        const formattedPolicies = data
          .map(
            (policy) => `
          Policy Name: "${policy.name}"
          Action: ${policy.action}
          Roles: ${policy.roles.join(', ')}
          Command: ${policy.command}
          Definition: ${policy.definition}
          ${policy.check ? `Check: ${policy.check}` : ''}
        `
          )
          .join('\n')

        return stripIndent`
          You're a Supabase Postgres expert in writing row level security policies. Your purpose is to
          generate a policy with the constraints given by the user. You should first retrieve schema information to write policies for, usually the 'public' schema.

          The output should use the following instructions:
          - The generated SQL must be valid SQL.
          - You can use only CREATE POLICY or ALTER POLICY queries, no other queries are allowed.
          - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
          - You can add short explanations to your messages.
          - The result should be a valid markdown. The SQL code should be wrapped in \`\`\` (including sql language tag).
          - Always use "auth.uid()" instead of "current_user".
          - SELECT policies should always have USING but not WITH CHECK
          - INSERT policies should always have WITH CHECK but not USING
          - UPDATE policies should always have WITH CHECK and most often have USING
          - DELETE policies should always have USING but not WITH CHECK
          - Don't use \`FOR ALL\`. Instead separate into 4 separate policies for select, insert, update, and delete.
          - The policy name should be short but detailed text explaining the policy, enclosed in double quotes.
          - Always put explanations as separate text. Never use inline SQL comments.
          - If the user asks for something that's not related to SQL policies, explain to the user
            that you can only help with policies.
          - Discourage \`RESTRICTIVE\` policies and encourage \`PERMISSIVE\` policies, and explain why.

          The output should look like this:
          \`\`\`sql
          CREATE POLICY "My descriptive policy." ON books FOR INSERT to authenticated USING ( (select auth.uid()) = author_id ) WITH ( true );
          \`\`\`

          Since you are running in a Supabase environment, take note of these Supabase-specific additions:

          ## Authenticated and unauthenticated roles

          Supabase maps every request to one of the roles:

          - \`anon\`: an unauthenticated request (the user is not logged in)
          - \`authenticated\`: an authenticated request (the user is logged in)

          These are actually [Postgres Roles](/docs/guides/database/postgres/roles). You can use these roles within your Policies using the \`TO\` clause:

          \`\`\`sql
          create policy "Profiles are viewable by everyone"
          on profiles
          for select
          to authenticated, anon
          using ( true );

          -- OR

          create policy "Public profiles are viewable only by authenticated users"
          on profiles
          for select
          to authenticated
          using ( true );
          \`\`\`

          Note that \`for ...\` must be added after the table but before the roles. \`to ...\` must be added after \`for ...\`:

          ### Incorrect
          \`\`\`sql
          create policy "Public profiles are viewable only by authenticated users"
          on profiles
          to authenticated
          for select
          using ( true );
          \`\`\`

          ### Correct
          \`\`\`sql
          create policy "Public profiles are viewable only by authenticated users"
          on profiles
          for select
          to authenticated
          using ( true );
          \`\`\`

          ## Multiple operations
          PostgreSQL policies do not support specifying multiple operations in a single FOR clause. You need to create separate policies for each operation.

          ### Incorrect
          \`\`\`sql
          create policy "Profiles can be created and deleted by any user"
          on profiles
          for insert, delete -- cannot create a policy on multiple operators
          to authenticated
          with check ( true )
          using ( true );
          \`\`\`

          ### Correct
          \`\`\`sql
          create policy "Profiles can be created by any user"
          on profiles
          for insert
          to authenticated
          with check ( true );

          create policy "Profiles can be deleted by any user"
          on profiles
          for delete
          to authenticated
          using ( true );
          \`\`\`

          ## Helper functions

          Supabase provides some helper functions that make it easier to write Policies.

          ### \`auth.uid()\`

          Returns the ID of the user making the request.

          ### \`auth.jwt()\`

          Returns the JWT of the user making the request. Anything that you store in the user's \`raw_app_meta_data\` column or the \`raw_user_meta_data\` column will be accessible using this function. It's important to know the distinction between these two:

          - \`raw_user_meta_data\` - can be updated by the authenticated user using the \`supabase.auth.update()\` function. It is not a good place to store authorization data.
          - \`raw_app_meta_data\` - cannot be updated by the user, so it's a good place to store authorization data.

          The \`auth.jwt()\` function is extremely versatile. For example, if you store some team data inside \`app_metadata\`, you can use it to determine whether a particular user belongs to a team. For example, if this was an array of IDs:

          \`\`\`sql
          create policy "User is in team"
          on my_table
          to authenticated
          using ( team_id in (select auth.jwt() -> 'app_metadata' -> 'teams'));
          \`\`\`

          ### MFA

          The \`auth.jwt()\` function can be used to check for [Multi-Factor Authentication](/docs/guides/auth/auth-mfa#enforce-rules-for-mfa-logins). For example, you could restrict a user from updating their profile unless they have at least 2 levels of authentication (Assurance Level 2):

          \`\`\`sql
          create policy "Restrict updates."
          on profiles
          as restrictive
          for update
          to authenticated using (
            (select auth.jwt()->>'aal') = 'aal2'
          );
          \`\`\`

          ## RLS performance recommendations

          Every authorization system has an impact on performance. While row level security is powerful, the performance impact is important to keep in mind. This is especially true for queries that scan every row in a table - like many \`select\` operations, including those using limit, offset, and ordering.

          Based on a series of [tests](https://github.com/GaryAustin1/RLS-Performance), we have a few recommendations for RLS:

          ### Add indexes

          Make sure you've added [indexes](/docs/guides/database/postgres/indexes) on any columns used within the Policies which are not already indexed (or primary keys). For a Policy like this:

          \`\`\`sql
          create policy "Users can access their own records" on test_table
          to authenticated
          using ( (select auth.uid()) = user_id );
          \`\`\`

          You can add an index like:

          \`\`\`sql
          create index userid
          on test_table
          using btree (user_id);
          \`\`\`

          ### Call functions with \`select\`

          You can use \`select\` statement to improve policies that use functions. For example, instead of this:

          \`\`\`sql
          create policy "Users can access their own records" on test_table
          to authenticated
          using ( auth.uid() = user_id );
          \`\`\`

          You can do:

          \`\`\`sql
          create policy "Users can access their own records" on test_table
          to authenticated
          using ( (select auth.uid()) = user_id );
          \`\`\`

          This method works well for JWT functions like \`auth.uid()\` and \`auth.jwt()\` as well as \`security definer\` Functions. Wrapping the function causes an \`initPlan\` to be run by the Postgres optimizer, which allows it to "cache" the results per-statement, rather than calling the function on each row.

          Caution: You can only use this technique if the results of the query or function do not change based on the row data.

          ### Minimize joins

          You can often rewrite your Policies to avoid joins between the source and the target table. Instead, try to organize your policy to fetch all the relevant data from the target table into an array or set, then you can use an \`IN\` or \`ANY\` operation in your filter.

          For example, this is an example of a slow policy which joins the source \`test_table\` to the target \`team_user\`:

          \`\`\`sql
          create policy "Users can access records belonging to their teams" on test_table
          to authenticated
          using (
            (select auth.uid()) in (
              select user_id
              from team_user
              where team_user.team_id = team_id -- joins to the source "test_table.team_id"
            )
          );
          \`\`\`

          We can rewrite this to avoid this join, and instead select the filter criteria into a set:

          \`\`\`sql
          create policy "Users can access records belonging to their teams" on test_table
          to authenticated
          using (
            team_id in (
              select team_id
              from team_user
              where user_id = (select auth.uid()) -- no join
            )
          );
          \`\`\`

          ### Specify roles in your policies

          Always use the Role of inside your policies, specified by the \`TO\` operator. For example, instead of this query:

          \`\`\`sql
          create policy "Users can access their own records" on rls_test
          using ( auth.uid() = user_id );
          \`\`\`

          Use:

          \`\`\`sql
          create policy "Users can access their own records" on rls_test
          to authenticated
          using ( (select auth.uid()) = user_id );
          \`\`\`

          This prevents the policy \`( (select auth.uid()) = user_id )\` from running for any \`anon\` users, since the execution stops at the \`to authenticated\` step.

          ${data.length > 0 ? `Here are my existing policies: ${formattedPolicies}` : ''}
        `
      },
    }),
    getFunctions: tool({
      description: 'Get database functions for one or more schemas',
      parameters: z.object({
        schemas: z.array(z.string()).describe('The schema names to get the functions for'),
      }),
      execute: async ({ schemas }) => {
        try {
          const data = includeSchemaMetadata
            ? await getDatabaseFunctions(
                {
                  projectRef,
                  connectionString,
                },
                undefined,
                headers
              )
            : []

          // Filter functions by requested schemas
          const filteredFunctions = data.filter((func) => schemas.includes(func.schema))

          const formattedFunctions = filteredFunctions
            .map(
              (func) => `
          Function Name: "${func.name}"
          Schema: ${func.schema}
          Arguments: ${func.argument_types}
          Return Type: ${func.return_type}
          Language: ${func.language}
          Definition: ${func.definition}
        `
            )
            .join('\n')

          return formattedFunctions
        } catch (error) {
          console.error('Failed to fetch functions:', error)
          return `Failed to fetch functions: ${error}`
        }
      },
    }),
    getEdgeFunctionKnowledge: tool({
      description: 'Get knowledge about how to write edge functions for Supabase',
      parameters: z.object({}),
      execute: async ({}) => {
        return stripIndent`
        # Writing Supabase Edge Functions

        You're an expert in writing TypeScript and Deno JavaScript runtime. Generate **high-quality Supabase Edge Functions** that adhere to the following best practices:

        ## Guidelines

        1. Try to use Web APIs and Deno's core APIs instead of external dependencies (eg: use fetch instead of Axios, use WebSockets API instead of node-ws)
        2. Do NOT use bare specifiers when importing dependencies. If you need to use an external dependency, make sure it's prefixed with either \`npm:\` or \`jsr:\`. For example, \`@supabase/supabase-js\` should be written as \`npm:@supabase/supabase-js\`.
        3. For external imports, always define a version. For example, \`npm:@express\` should be written as \`npm:express@4.18.2\`.
        4. For external dependencies, importing via \`npm:\` and \`jsr:\` is preferred. Minimize the use of imports from @\`deno.land/x\` , \`esm.sh\` and @\`unpkg.com\` . If you have a package from one of those CDNs, you can replace the CDN hostname with \`npm:\` specifier.
        5. You can also use Node built-in APIs. You will need to import them using \`node:\` specifier. For example, to import Node process: \`import process from "node:process"\`. Use Node APIs when you find gaps in Deno APIs.
        6. Do NOT use \`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"\`. Instead use the built-in \`Deno.serve\`.
        7. Following environment variables (ie. secrets) are pre-populated in both local and hosted Supabase environments. Users don't need to manually set them:
          * SUPABASE_URL
          * SUPABASE_ANON_KEY
          * SUPABASE_SERVICE_ROLE_KEY
          * SUPABASE_DB_URL
        8. To set other environment variables the user can go to project settings then edge functions to set them
        9. A single Edge Function can handle multiple routes. It is recommended to use a library like Express or Hono to handle the routes as it's easier for developer to understand and maintain. Each route must be prefixed with \`/function-name\` so they are routed correctly.
        10. File write operations are ONLY permitted on \`/tmp\` directory. You can use either Deno or Node File APIs.
        11. Use \`EdgeRuntime.waitUntil(promise)\` static method to run long-running tasks in the background without blocking response to a request. Do NOT assume it is available in the request / execution context.

        ## Example Templates

        ### Simple Hello World Function

        \`\`\`edge
        // Setup type definitions for built-in Supabase Runtime APIs
        import "jsr:@supabase/functions-js/edge-runtime.d.ts";
        interface reqPayload {
          name: string;
        }

        console.info('server started');

        Deno.serve(async (req: Request) => {
          const { name }: reqPayload = await req.json();
          const data = {
            message: \`Hello \${name} from foo!\`,
          };

          return new Response(
            JSON.stringify(data),
            { headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }}
          );
        });
        \`\`\`

        ### Example Function using Node built-in API

        \`\`\`edge
        // Setup type definitions for built-in Supabase Runtime APIs
        import "jsr:@supabase/functions-js/edge-runtime.d.ts";
        import { randomBytes } from "node:crypto";
        import { createServer } from "node:http";
        import process from "node:process";

        const generateRandomString = (length) => {
          const buffer = randomBytes(length);
          return buffer.toString('hex');
        };

        const randomString = generateRandomString(10);
        console.log(randomString);

        const server = createServer((req, res) => {
          const message = \`Hello\`;
          res.end(message);
        });

        server.listen(9999);
        \`\`\`

        ### Using npm packages in Functions

        \`\`\`edge
        // Setup type definitions for built-in Supabase Runtime APIs
        import "jsr:@supabase/functions-js/edge-runtime.d.ts";
        import express from "npm:express@4.18.2";

        const app = express();

        app.get(/(.*)/, (req, res) => {
          res.send("Welcome to Supabase");
        });

        app.listen(8000);
        \`\`\`

        ### Generate embeddings using built-in @Supabase.ai API

        \`\`\`edge
        // Setup type definitions for built-in Supabase Runtime APIs
        import "jsr:@supabase/functions-js/edge-runtime.d.ts";
        const model = new Supabase.ai.Session('gte-small');

        Deno.serve(async (req: Request) => {
          const params = new URL(req.url).searchParams;
          const input = params.get('text');
          const output = await model.run(input, { mean_pool: true, normalize: true });
          return new Response(
            JSON.stringify(output),
            {
              headers: {
                'Content-Type': 'application/json',
                'Connection': 'keep-alive',
              },
            },
          );
        });
        \`\`\`

        ## Integrating with Supabase Auth

        \`\`\`edge
          // Setup type definitions for built-in Supabase Runtime APIs
          import "jsr:@supabase/functions-js/edge-runtime.d.ts";
          import { createClient } from \\'jsr:@supabase/supabase-js@2\\'
          import { corsHeaders } from \\'../_shared/cors.ts\\'

          console.log(\`Function "select-from-table-with-auth-rls" up and running!\`)

          Deno.serve(async (req: Request) => {
            // This is needed if you\\'re planning to invoke your function from a browser.
            if (req.method === \\'OPTIONS\\') {
              return new Response(\\'ok\\', { headers: corsHeaders })
            }

            try {
              // Create a Supabase client with the Auth context of the logged in user.
              const supabaseClient = createClient(
                // Supabase API URL - env var exported by default.
                Deno.env.get('SUPABASE_URL')!,
                // Supabase API ANON KEY - env var exported by default.
                Deno.env.get('SUPABASE_ANON_KEY')!,
                // Create client with Auth context of the user that called the function.
                // This way your row-level-security (RLS) policies are applied.
                {
                  global: {
                    headers: { Authorization: req.headers.get(\\'Authorization\\')! },
                  },
                }
              )

              // First get the token from the Authorization header
              const token = req.headers.get(\\'Authorization\\').replace(\\'Bearer \\', \\'\\')

              // Now we can get the session or user object
              const {
                data: { user },
              } = await supabaseClient.auth.getUser(token)

              // And we can run queries in the context of our authenticated user
              const { data, error } = await supabaseClient.from(\\'users\\').select(\\'*\\')
              if (error) throw error

              return new Response(JSON.stringify({ user, data }), {
                headers: { ...corsHeaders, \\'Content-Type\\': \\'application/json\\' },
                status: 200,
              })
            } catch (error) {
              return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, \\'Content-Type\\': \\'application/json\\' },
                status: 400,
              })
            }
          })

          // To invoke:
          // curl -i --location --request POST \\'http://localhost:54321/functions/v1/select-from-table-with-auth-rls\\' \\
          //   --header \\'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs\\' \\
          //   --header \\'Content-Type: application/json\\' \\
          //   --data \\'{"name":"Functions"}\\'
        \`\`\`
        `
      },
    }),
    getLogsExplorerKnowledge: tool({
      description: 'Get knowledge about how to write queries for the Supabase Logs Explorer',
      parameters: z.object({}),
      execute: async ({}) => {
        return stripIndent`
        # Querying Logs in Supabase Logs Explorer

        You're an expert in writing SQL queries for the Supabase Logs Explorer. The Logs Explorer uses BigQuery and supports all available SQL functions and operators.

        ## Available Log Sources

        The following log sources are available from the Sources drop-down:

        * \`auth_logs\`: GoTrue server logs containing authentication/authorization activity
        * \`edge_logs\`: Edge network logs containing request and response metadata from Cloudflare
        * \`function_edge_logs\`: Edge network logs for edge functions, containing network requests and response metadata
        * \`function_logs\`: Function internal logs containing any console logging from edge functions
        * \`postgres_logs\`: Postgres database logs containing statements executed by connected applications
        * \`realtime_logs\`: Realtime server logs containing client connection information
        * \`storage_logs\`: Storage server logs containing object upload and retrieval information

        ## Working with Timestamps

        Each log entry has a \`timestamp\` field of type \`TIMESTAMP\`. Important considerations:

        1. Raw timestamps are displayed in unix microseconds
        2. Use \`DATETIME()\` to convert timestamps to human-readable ISO-8601 format:

        \`\`\`sql
        -- Raw timestamp (unix microseconds)
        SELECT timestamp FROM edge_logs;
        -- Returns: 1664270180000

        -- Formatted timestamp
        SELECT DATETIME(timestamp) FROM edge_logs;
        -- Returns: 2022-09-27T09:17:10.439Z
        \`\`\`

        ## Working with Nested Arrays

        Log events store metadata as nested arrays of objects. To query nested data:

        1. Use \`UNNEST()\` for each array level you want to access
        2. Add joins for each level of nesting
        3. Reference nested objects using aliases

        Example querying edge logs:

        \`\`\`sql
        SELECT 
          DATETIME(timestamp),
          request.method,
          header.cf_ipcountry
        FROM
          edge_logs AS t
          CROSS JOIN UNNEST(t.metadata) AS metadata
          CROSS JOIN UNNEST(metadata.request) AS request
          CROSS JOIN UNNEST(request.headers) AS header;
        \`\`\`

        ## Best Practices

        1. Always include a filter on \`timestamp\` to optimize query performance
        2. Avoid selecting large nested objects - select individual values instead
        3. Use \`LIMIT\` to reduce returned rows (max 1000 rows per query)

        Examples:

        ### Edge function 500 error
        \`\`\`sql
        select id, function_edge_logs.timestamp, event_message, response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version from function_edge_logs
        cross join unnest(metadata) as m
        cross join unnest(m.response) as response
        cross join unnest(m.request) as request
        where (response.status_code between 500 and 599)
        order by timestamp desc
        limit 100
        \`\`\`
        ### ❌ Avoid selecting entire metadata objects
        \`\`\`sql
        SELECT
          DATETIME(timestamp),
          m AS metadata  -- Selects entire metadata object
        FROM
          edge_logs AS t
          CROSS JOIN UNNEST(t.metadata) AS m;
        \`\`\`

        ### ✅ Select specific needed values
        \`\`\`sql
        SELECT
          DATETIME(timestamp),
          r.method  -- Select only required fields
        FROM
          edge_logs AS t
          CROSS JOIN UNNEST(t.metadata) AS m
          CROSS JOIN UNNEST(m.request) AS r;
        \`\`\`

        ## Common Query Examples

        ### Get user IP addresses from edge logs:
        \`\`\`sql
        SELECT 
          DATETIME(timestamp),
          h.x_real_ip
        FROM
          edge_logs
          CROSS JOIN UNNEST(metadata) AS m
          CROSS JOIN UNNEST(m.request) AS r
          CROSS JOIN UNNEST(r.headers) AS h
        WHERE 
          h.x_real_ip IS NOT NULL 
          AND r.method = "GET"
        LIMIT 1000;
        \`\`\`

        ### Slowest queries

        \`\`\`sql
        SELECT 
          DATETIME(pl.timestamp) AS time,
          p.command_tag,
          p.backend_type,
          p.connection_from
      FROM 
        postgres_logs AS pl
      CROSS JOIN UNNEST(pl.metadata) AS m
      CROSS JOIN UNNEST(m.parsed) AS p
      WHERE 
        p.command_tag IS NOT NULL
        ORDER BY 
          pl.timestamp DESC
        LIMIT 1000;
        \`\`\`

        ### Filter logs by time range:
        \`\`\`sql
        SELECT 
          DATETIME(timestamp) as time,
          event_message
        FROM postgres_logs
        WHERE 
          timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
        ORDER BY timestamp DESC
        LIMIT 1000;
        \`\`\`

        Remember:
        - The Logs Explorer has a maximum of 1000 rows per query
        - Log retention depends on your project's pricing plan
        - Use appropriate timestamp filters to optimize performance
        - Avoid selecting entire nested objects when possible

        ## Logs Field Reference

        Below is the complete field reference for each log source. To access nested fields, you'll need to use the appropriate UNNEST joins as shown in the examples above.

        
        ### Function Edge Logs (\`function_edge_logs\`)

        | Field | Type |
        |-------|------|
        | event_message | string |
        | id | string |
        | timestamp | datetime |
        | metadata.deployment_id | string |
        | metadata.execution_time_ms | number |
        | metadata.function_id | string |
        | metadata.project_ref | string |
        | metadata.request.headers.accept | string |
        | metadata.request.headers.content_length | string |
        | metadata.request.headers.host | string |
        | metadata.request.headers.user_agent | string |
        | metadata.request.host | string |
        | metadata.request.method | string |
        | metadata.request.pathname | string |
        | metadata.request.protocol | string |
        | metadata.request.url | string |
        | metadata.response.headers.content_length | string |
        | metadata.response.headers.content_type | string |
        | metadata.response.headers.date | string |
        | metadata.response.headers.server | string |
        | metadata.response.headers.vary | string |
        | metadata.response.status_code | number |
        | metadata.version | string |

        ### API Edge Logs (\`edge_logs\`)

        | Field | Type |
        |-------|------|
        | id | string |
        | timestamp | datetime |
        | event_message | string |
        | identifier | string |
        | metadata.load_balancer_redirect_identifier | string |
        | metadata.request.cf.asOrganization | string |
        | metadata.request.cf.asn | number |
        | metadata.request.cf.botManagement.corporateProxy | boolean |
        | metadata.request.cf.botManagement.detectionIds | number[] |
        | metadata.request.cf.botManagement.ja3Hash | string |
        | metadata.request.cf.botManagement.score | number |
        | metadata.request.cf.botManagement.staticResource | boolean |
        | metadata.request.cf.botManagement.verifiedBot | boolean |
        | metadata.request.cf.city | string |
        | metadata.request.cf.clientTcpRtt | number |
        | metadata.request.cf.clientTrustScore | number |
        | metadata.request.cf.colo | string |
        | metadata.request.cf.continent | string |
        | metadata.request.cf.country | string |
        | metadata.request.cf.edgeRequestKeepAliveStatus | number |
        | metadata.request.cf.httpProtocol | string |
        | metadata.request.cf.latitude | string |
        | metadata.request.cf.longitude | string |
        | metadata.request.cf.metroCode | string |
        | metadata.request.cf.postalCode | string |
        | metadata.request.cf.region | string |
        | metadata.request.cf.timezone | string |
        | metadata.request.cf.tlsCipher | string |
        | metadata.request.cf.tlsClientAuth.certPresented | string |
        | metadata.request.cf.tlsClientAuth.certRevoked | string |
        | metadata.request.cf.tlsClientAuth.certVerified | string |
        | metadata.request.cf.tlsExportedAuthenticator.clientFinished | string |
        | metadata.request.cf.tlsExportedAuthenticator.clientHandshake | string |
        | metadata.request.cf.tlsExportedAuthenticator.serverFinished | string |
        | metadata.request.cf.tlsExportedAuthenticator.serverHandshake | string |
        | metadata.request.cf.tlsVersion | string |
        | metadata.request.headers.cf_connecting_ip | string |
        | metadata.request.headers.cf_ipcountry | string |
        | metadata.request.headers.cf_ray | string |
        | metadata.request.headers.host | string |
        | metadata.request.headers.referer | string |
        | metadata.request.headers.x_client_info | string |
        | metadata.request.headers.x_forwarded_proto | string |
        | metadata.request.headers.x_real_ip | string |
        | metadata.request.host | string |
        | metadata.request.method | string |
        | metadata.request.path | string |
        | metadata.request.protocol | string |
        | metadata.request.search | string |
        | metadata.request.url | string |
        | metadata.response.headers.cf_cache_status | string |
        | metadata.response.headers.cf_ray | string |
        | metadata.response.headers.content_location | string |
        | metadata.response.headers.content_range | string |
        | metadata.response.headers.content_type | string |
        | metadata.response.headers.date | string |
        | metadata.response.headers.sb_gateway_version | string |
        | metadata.response.headers.transfer_encoding | string |
        | metadata.response.headers.x_kong_proxy_latency | string |
        | metadata.response.origin_time | number |
        | metadata.response.status_code | number |

        ### PostgREST Logs (\`postgrest_logs\`)

        | Field | Type |
        |-------|------|
        | event_message | string |
        | id | string |
        | identifier | string |
        | timestamp | datetime |
        | metadata.host | string |

        ### Auth Logs (\`auth_logs\`)

        | Field | Type |
        |-------|------|
        | event_message | string |
        | id | string |
        | timestamp | datetime |
        | metadata.auth_event.action | string |
        | metadata.auth_event.actor_id | string |
        | metadata.auth_event.actor_username | string |
        | metadata.auth_event.log_type | string |
        | metadata.auth_event.traits.provider | string |
        | metadata.auth_event.traits.user_email | string |
        | metadata.auth_event.traits.user_id | string |
        | metadata.auth_event.traits.user_phone | string |
        | metadata.component | string |
        | metadata.duration | number |
        | metadata.host | string |
        | metadata.level | string |
        | metadata.method | string |
        | metadata.msg | string |
        | metadata.path | string |
        | metadata.referer | string |
        | metadata.remote_addr | string |
        | metadata.status | number |
        | metadata.timestamp | string |

        ### Storage Logs (\`storage_logs\`)

        | Field | Type |
        |-------|------|
        | event_message | string |
        | id | string |
        | timestamp | datetime |
        | metadata.context.host | string |
        | metadata.context.pid | number |
        | metadata.level | string |
        | metadata.project | string |
        | metadata.req.headers.accept | string |
        | metadata.req.headers.cf_connecting_ip | string |
        | metadata.req.headers.cf_ray | string |
        | metadata.req.headers.content_length | string |
        | metadata.req.headers.content_type | string |
        | metadata.req.headers.host | string |
        | metadata.req.headers.referer | string |
        | metadata.req.headers.user_agent | string |
        | metadata.req.headers.x_client_info | string |
        | metadata.req.headers.x_forwarded_proto | string |
        | metadata.req.hostname | string |
        | metadata.req.method | string |
        | metadata.req.remoteAddress | string |
        | metadata.req.remotePort | number |
        | metadata.req.url | string |
        | metadata.reqId | string |
        | metadata.res.statusCode | number |
        | metadata.res.headers.content_length | number |
        | metadata.res.headers.content_type | string |
        | metadata.responseTime | number |
        | metadata.tenantId | string |
        | metadata.rawError | string |

        ### Function Runtime Logs (\`function_logs\`)

        | Field | Type |
        |-------|------|
        | event_message | string |
        | id | string |
        | timestamp | datetime |
        | metadata.deployment_id | string |
        | metadata.event_type | string |
        | metadata.execution_id | string |
        | metadata.function_id | string |
        | metadata.level | string |
        | metadata.project_ref | string |
        | metadata.region | string |
        | metadata.timestamp | string |
        | metadata.version | string |

        ### Postgres Logs (\`postgres_logs\`)

        | Field | Type |
        |-------|------|
        | event_message | string |
        | id | string |
        | timestamp | datetime |
        | identifier | string |
        | metadata.host | string |
        | metadata.parsed.backend_type | string |
        | metadata.parsed.command_tag | string |
        | metadata.parsed.connection_from | string |
        | metadata.parsed.database_name | string |
        | metadata.parsed.error_severity | string |
        | metadata.parsed.process_id | number |
        | metadata.parsed.query_id | number |
        | metadata.parsed.session_id | string |
        | metadata.parsed.session_line_num | number |
        | metadata.parsed.session_start_time | string |
        | metadata.parsed.sql_state_code | string |
        | metadata.parsed.timestamp | string |
        | metadata.parsed.transaction_id | number |
        | metadata.parsed.user_name | string |
        | metadata.parsed.virtual_transaction_id | string |

        ### Realtime Logs (\`realtime_logs\`)

        | Field | Type |
        |-------|------|
        | event_message | string |
        | id | string |
        | timestamp | datetime |
        | metadata.level | string |
        | metadata.measurements.connected | number |
        | metadata.measurements.connected_cluster | number |
        | metadata.measurements.limit | number |
        | metadata.measurements.sum | number |
        | metadata.external_id | string |

        ### Supavisor Logs (\`supavisor_logs\`)

        | Field | Type |
        |-------|------|
        | event_message | string |
        | id | string |
        | timestamp | datetime |
        | metadata.host | string |

        Example query using nested fields:
        \`\`\`sql
        -- Query auth logs for specific user actions
        SELECT
          DATETIME(timestamp) as time,
          metadata.auth_event.action,
          metadata.auth_event.actor_username,
          metadata.auth_event.traits.user_email
        FROM auth_logs
        CROSS JOIN UNNEST(metadata.auth_event) as auth_event
        WHERE 
          metadata.auth_event.action = 'login'
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
        ORDER BY timestamp DESC
        LIMIT 1000;
        \`\`\`
        `
      },
    }),
  }
}
