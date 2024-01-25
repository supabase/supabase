import { Context, Hono } from "https://deno.land/x/hono@v3.0.1/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const app = new Hono();

app.get(
  "/hello-world",
  (c: Context) => c.text("Hello World from hono-server!"),
);

// This is your supabase function name, change accordingly
const functionName = "hono-server";
const mainRouter = new Hono().route(`/${functionName}`, app).fetch;
serve(mainRouter);
