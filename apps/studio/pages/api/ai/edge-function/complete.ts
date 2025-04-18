import { openai } from '@ai-sdk/openai'
import pgMeta from '@supabase/pg-meta'
import { streamText } from 'ai'
import { executeSql } from 'data/sql/execute-sql-query'
import { NextApiRequest, NextApiResponse } from 'next'
import { getTools } from '../sql/tools'

export const maxDuration = 30
const openAiKey = process.env.OPENAI_API_KEY
const pgMetaSchemasList = pgMeta.schemas.list()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return new Response(
      JSON.stringify({
        error: 'No OPENAI_API_KEY set. Create this environment variable to use AI features.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      return new Response(
        JSON.stringify({ data: null, error: { message: `Method ${method} Not Allowed` } }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', Allow: 'POST' },
        }
      )
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { completionMetadata, projectRef, connectionString, includeSchemaMetadata } = req.body
    const { textBeforeCursor, textAfterCursor, language, prompt, selection } = completionMetadata

    if (!projectRef) {
      return res.status(400).json({
        error: 'Missing project_ref in request body',
      })
    }

    const authorization = req.headers.authorization

    const { result: schemas } = includeSchemaMetadata
      ? await executeSql(
          {
            projectRef,
            connectionString,
            sql: pgMetaSchemasList.sql,
          },
          undefined,
          {
            'Content-Type': 'application/json',
            ...(authorization && { Authorization: authorization }),
          }
        )
      : { result: [] }

    const result = await streamText({
      model: openai('gpt-4o-mini-2024-07-18'),
      maxSteps: 5,
      tools: getTools({ projectRef, connectionString, authorization, includeSchemaMetadata }),
      system: `
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

      Database Integration:
      - Use the getSchema tool to understand the database structure when needed
      - Reference existing tables and schemas to ensure edge functions work with the user's data model
      - Use proper types that match the database schema
      - When accessing the database:
        - Use RLS policies appropriately for security
        - Handle database errors gracefully
        - Use efficient queries and proper indexing
        - Consider rate limiting for resource-intensive operations
        - Use connection pooling when appropriate
        - Implement proper error handling for database operations

      # For all your abilities, follow these instructions:
      - First look at the list of provided schemas and if needed, get more information about a schema to understand the data model you're working with
      - If the edge function needs to interact with user data, check both the public and auth schemas to understand the authentication setup

      Here are the existing database schema names you can retrieve: ${schemas}
      `,
      messages: [
        {
          role: 'user',
          content: `You are helping me write TypeScript/JavaScript code for an edge function.
            Here is the context:
            ${textBeforeCursor}<selection>${selection}</selection>${textAfterCursor}
            
            Instructions:
            1. Only modify the selected text based on this prompt: ${prompt}
            2. Your response should be ONLY the modified selection text, nothing else. Remove selected text if needed.
            3. Do not wrap in code blocks or markdown
            4. You can respond with one word or multiple words
            5. Ensure the modified text flows naturally within the current line
            6. Avoid duplicating variable declarations, imports, or function definitions when considering the full code
            7. If there is no surrounding context (before or after), make sure your response is a complete valid Deno Edge Function including imports.
            
            Modify the selected text now:`,
        },
      ],
    })

    return result.pipeDataStreamToResponse(res)
  } catch (error) {
    console.error('Completion error:', error)
    return res.status(500).json({
      error: 'Failed to generate completion',
    })
  }
}
