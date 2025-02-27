export const EDGE_FUNCTION_TEMPLATES = [
  {
    value: 'hello-world',
    name: 'Simple Hello World',
    description: 'Basic function that returns a JSON response',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
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
});`,
  },
  {
    value: 'database-access',
    name: 'Supabase Database Access',
    description: 'Example using Supabase client to query your database',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data, error } = await supabase.from('table_name').select('*')

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})`,
  },
  {
    value: 'node-api',
    name: 'Node Built-in API Example',
    description: 'Example using Node.js built-in crypto and http modules',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
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

server.listen(9999);`,
  },
  {
    value: 'express',
    name: 'Express Server',
    description: 'Example using Express.js for routing',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import express from "npm:express@4.18.2";

const app = express();

app.get(/(.*)/, (req, res) => {
  res.send("Welcome to Supabase");
});

app.listen(8000);`,
  },
]
