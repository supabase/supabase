---
# Specify the following for Cursor rules
description: Coding rules for Supabase Edge Functions
globs: "supabase/functions/**/*.ts"
---

# Writing Supabase Edge Functions

You're an expert in writing TypeScript and Deno JavaScript runtime. Generate **high-quality Supabase Edge Functions** that adhere to the following best practices:

## Guidelines

1. Try to use Web APIs and Deno’s core APIs instead of external dependencies (eg: use fetch instead of Axios, use WebSockets API instead of node-ws)
2. If you are reusing utility methods between Edge Functions, add them to `supabase/functions/_shared` and import using a relative path. Do NOT have cross dependencies between Edge Functions.
3. Do NOT use bare specifiers when importing dependecnies. If you need to use an external dependency, make sure it's prefixed with either `npm:` or `jsr:`. For example, `@supabase/supabase-js` should be written as `npm:@supabase/supabase-js`.
4. For external imports, always define a version. For example, `npm:@express` should be written as `npm:express@4.18.2`.
5. For external dependencies, importing via `npm:` and `jsr:` is preferred. Minimize the use of imports from @`deno.land/x` , `esm.sh` and @`unpkg.com` . If you have a package from one of those CDNs, you can replace the CDN hostname with `npm:` specifier.
6. You can also use Node built-in APIs. You will need to import them using `node:` specifier. For example, to import Node process: `import process from "node:process". Use Node APIs when you find gaps in Deno APIs.
7. Do NOT use `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`. Instead use the built-in `Deno.serve`.
8. Following environment variables (ie. secrets) are pre-populated in both local and hosted Supabase environments. Users don't need to manually set them:
	* SUPABASE_URL
	* SUPABASE_ANON_KEY
	* SUPABASE_SERVICE_ROLE_KEY
	* SUPABASE_DB_URL
9. To set other environment variables (ie. secrets) users can put them in a env file and run the `supabase secrets set --env-file path/to/env-file`
10. A single Edge Function can handle multiple routes. It is recommended to use a library like Express or Hono to handle the routes as it's easier for developer to understand and maintain. Each route must be prefixed with `/function-name` so they are routed correctly.
11. File write operations are ONLY permitted on `/tmp` directory. You can use either Deno or Node File APIs.
12. Use `EdgeRuntime.waitUntil(promise)` static method to run long-running tasks in the background without blocking response to a request. Do NOT assume it is available in the request / execution context.

## Example Templates

### Simple Hello World Function

```tsx
interface reqPayload {
	name: string;
}

console.info('server started');

Deno.serve(async (req: Request) => {
	const { name }: reqPayload = await req.json();
	const data = {
		message: `Hello ${name} from foo!`,
	};

	return new Response(
		JSON.stringify(data),
		{ headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }}
		);
});

```

### Example Function using Node built-in API

```tsx
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
    const message = `Hello`;
    res.end(message);
});

server.listen(9999);
```

### Using npm packages in Functions

```tsx
import express from "npm:express@4.18.2";

const app = express();

app.get(/(.*)/, (req, res) => {
    res.send("Welcome to Supabase");
});

app.listen(8000);

```

### Generate embeddings using built-in @Supabase.ai API

```tsx
const model = new Supabase.ai.Session('gte-small');

Deno.serve(async (req: Request) => {
	const params = new URL(req.url).searchParams;
	const input = params.get('text');
	const output = await model.run(input, { mean_pool: true, normalize: true });
	return new Response(
		JSON.stringify(
			output,
		),
		{
			headers: {
				'Content-Type': 'application/json',
				'Connection': 'keep-alive',
			},
		},
	);
});

```
