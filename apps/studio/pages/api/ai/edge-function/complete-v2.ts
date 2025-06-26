import pgMeta from '@supabase/pg-meta'
import { streamText } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'

import { IS_PLATFORM } from 'common'
import { executeSql } from 'data/sql/execute-sql-query'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'
import { queryPgMetaSelfHosted } from 'lib/self-hosted'
import { getTools } from '../sql/tools'

export const maxDuration = 60

const pgMetaSchemasList = pgMeta.schemas.list()

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { model, error: modelError } = await getModel()

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

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
          },
          IS_PLATFORM ? undefined : queryPgMetaSelfHosted
        )
      : { result: [] }

    const result = await streamText({
      model,
      maxSteps: 5,
      tools: getTools({ projectRef, connectionString, authorization, includeSchemaMetadata }),
      system: source`
        VERY IMPORTANT RULES:
        1. YOUR FINAL RESPONSE MUST CONTAIN ONLY THE MODIFIED TYPESCRIPT/JAVASCRIPT TEXT AND NOTHING ELSE. NO EXPLANATIONS, MARKDOWN, OR CODE BLOCKS.
        2. WHEN USING TOOLS: Call them directly based on the instructions. DO NOT add any explanatory text or conversation before or between tool calls in the output stream. Your reasoning is internal; just call the tool.

        You are a Supabase Edge Functions expert helping a user edit their TypeScript/JavaScript code based on a selection and a prompt.
        Your goal is to modify the selected code according to the user's prompt, using the available tools to understand the database schema if necessary.
        You MUST respond ONLY with the modified code that should replace the user's selection. Do not explain the changes or the tool results in the final output.

        # Core Task: Modify Selected Code
        - Focus solely on altering the provided TypeScript/JavaScript selection based on the user's instructions for a Supabase Edge Function.
        - Use the \`getSchema\` tool if the function interacts with the database and you need to understand table structures or relationships.

        # Edge Function Guidelines:
        You're an expert in writing TypeScript and Deno JavaScript runtime. Generate **high-quality Supabase Edge Functions** that adhere to the following best practices:
          1. Try to use Web APIs and Deno's core APIs instead of external dependencies (eg: use fetch instead of Axios, use WebSockets API instead of node-ws)
          2. Do NOT use bare specifiers when importing dependencies. If you need to use an external dependency, make sure it's prefixed with either \`npm:\` or \`jsr:\`. For example, \`@supabase/supabase-js\` should be written as \`npm:@supabase/supabase-js\`.
          3. For external imports, always define a version. For example, \`npm:@express\` should be written as \`npm:express@4.18.2\`.
          4. For external dependencies, importing via \`npm:\` and \`jsr:\` is preferred. Minimize the use of imports from \`@deno.land/x\` , \`esm.sh\` and \`@unpkg.com\` . If you have a package from one of those CDNs, you can replace the CDN hostname with \`npm:\` specifier.
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

        # Database Integration:
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

        # Example Templates:
          ### Simple Hello World Function
          \`\`\`typescript
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
          \`\`\`typescript
          // Setup type definitions for built-in Supabase Runtime APIs
          import "jsr:@supabase/functions-js/edge-runtime.d.ts";
          import { randomBytes } from "node:crypto";
          import { createServer } from "node:http";
          import process from "node:process";

          const generateRandomString = (length: number) => {
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
          \`\`\`typescript
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
          \`\`\`typescript
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

          ### Integrating with Supabase Auth
          \`\`\`typescript
            // Setup type definitions for built-in Supabase Runtime APIs
            import "jsr:@supabase/functions-js/edge-runtime.d.ts";
            import { createClient } from 'jsr:@supabase/supabase-js@2'
            import { corsHeaders } from '../_shared/cors.ts' // Assuming cors.ts is in a shared folder

            console.log(\`Function "select-from-table-with-auth-rls" up and running!\`)

            Deno.serve(async (req: Request) => {
              // This is needed if you're planning to invoke your function from a browser.
              if (req.method === 'OPTIONS') {
                return new Response('ok', { headers: corsHeaders })
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
                      headers: { Authorization: req.headers.get('Authorization')! },
                    },
                  }
                )

                // First get the token from the Authorization header
                const authHeader = req.headers.get('Authorization')
                if (!authHeader) {
                    throw new Error('Missing Authorization header')
                }
                const token = authHeader.replace('Bearer ', '')

                // Now we can get the session or user object
                const {
                  data: { user }, error: userError
                } = await supabaseClient.auth.getUser(token)
                if (userError) throw userError

                // Example: Select data associated with the authenticated user
                // Replace 'your_table' and 'user_id' with your actual table and column names
                // const { data, error } = await supabaseClient.from('your_table').select('*').eq('user_id', user.id)
                // if (error) throw error

                // Return some data (replace with your actual logic)
                return new Response(JSON.stringify({ user/*, data*/ }), { // Uncomment data if you query
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 200,
                })
              } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 400,
                })
              }
            })

            // To invoke:
            // curl -i --location --request POST 'http://localhost:54321/functions/v1/your-function-name' \\
            //   --header 'Authorization: Bearer <YOUR_USER_JWT>' \\
            //   --header 'Content-Type: application/json' \\
            //   --data '{"some":"payload"}' // Optional payload
          \`\`\`

        # Tool Usage:
        - First look at the list of provided schemas if database interaction is needed.
        - Use \`getSchema\` to understand the data model you're working with if the edge function needs to interact with user data.
        - Check both the public and auth schemas to understand the authentication setup if relevant.
        - The available database schema names are: ${schemas}

        # Response Format:
        - Your response MUST be ONLY the modified TypeScript/JavaScript text intended to replace the user's selection.
        - Do NOT include explanations, markdown formatting, or code blocks. NO MATTER WHAT.
        - Ensure the modified text integrates naturally with the surrounding code provided (\`textBeforeCursor\` and \`textAfterCursor\`).
        - Avoid duplicating variable declarations, imports, or function definitions already present in the surrounding context.
        - If there is no surrounding context (before or after), ensure your response is a complete, valid Deno Edge Function including necessary imports and setup.

        REMEMBER: ONLY OUTPUT THE CODE MODIFICATION.
      `,
      messages: [
        {
          role: 'user',
          content: source`
            You are helping me write TypeScript/JavaScript code for an edge function.
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
            
            Modify the selected text now:
          `,
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
