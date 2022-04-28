/*
 * description
 */
export default [
  {
    lang: 'js',
    title: 'Sending an email',
    description: 'Send an email via SMTP directly in the function',
    size: 'large',
    code: `import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
const client = new SmtpClient();
const { hostname, port, username, password } = Deno.env.toObject();

await client.connect({
  hostname,
  port: Number(port),
  username,
  password,
});

serve(async (_req) => {
  await client.send({
    from: "jonny@supabase.io",
    to: "div@supabase.io",
    subject: "Notifications Ui has launched",
    content: "And this is a notification about that",
  });

  return new Response("Email sent", { status: 200 });
});`,
  },
  {
    lang: 'js',
    title: 'Connect to database directly',
    description: `Connect to your database via pg_bouncer`,
    size: 'large',
    code: `import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.2/mod.ts";

const databaseUrl = Deno.env.get("DATABASE_URL") ?? "";
const pool = new postgres.Pool(databaseUrl, 3, true);
const connection = await pool.connect();

serve(async (req: Request) => {
  // sql inject your database
  const { query } = await req.json();
  const response = await connection.queryObject(query);
  console.log(response);
  return new Response("Query executed", { status: 200 });
});`,
  },
  {
    lang: 'js',
    title: 'Read from storage',
    description: `Read and write to any of your buckets, while also respecting storage auth policies.`,
    size: 'large',
    code: `import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@1.33.1";

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SERVICE_KEY") ?? "";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  if (req.headers.get("Authorization") === "super-secret-key") {
    const { data } = await supabase.storage
      .from("newbucket")
      .download("supameme.png");
    return new Response(data, { headers: { "content-type": "image/png" } });
  } else {
    return new Response("Forbidden", { status: 403 });
  }
});`,
  },
  {
    lang: 'js',
    title: 'Read from database',
    description: `Read, Write, Update, Insert anything on the database`,
    size: 'large',
    code: `import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@1.33.1";

serve(async () => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SERVICE_KEY") ?? "";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data } = await supabase.from("todos").select();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
});`,
  },
]
