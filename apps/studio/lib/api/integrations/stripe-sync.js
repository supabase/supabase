/**
 * Built from https://github.com/tx-stripe/stripe-sync-engine
 * 
 * This is only temporarily done this way until its moved to a proper npm package
 */

// src/supabase/supabase.ts
import { SupabaseManagementAPI } from "supabase-management-js";

// raw-ts:/Users/matt/Code/stripe-sync-engine-forked-by-stripe/packages/sync-engine/src/supabase/edge-functions/stripe-setup.ts
var stripe_setup_default = "import { StripeSync, runMigrations } from 'npm:stripe-experiment-sync'\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('Method not allowed', { status: 405 })\n  }\n\n  const authHeader = req.headers.get('Authorization')\n  if (!authHeader?.startsWith('Bearer ')) {\n    return new Response('Unauthorized', { status: 401 })\n  }\n\n  let stripeSync = null\n  try {\n    // Get and validate database URL\n    const rawDbUrl = Deno.env.get('SUPABASE_DB_URL')\n    if (!rawDbUrl) {\n      throw new Error('SUPABASE_DB_URL environment variable is not set')\n    }\n    // Remove sslmode from connection string (not supported by pg in Deno)\n    const dbUrl = rawDbUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '')\n\n    await runMigrations({ databaseUrl: dbUrl })\n\n    stripeSync = new StripeSync({\n      poolConfig: { connectionString: dbUrl, max: 2 }, // Need 2 for advisory lock + queries\n      stripeSecretKey: Deno.env.get('STRIPE_SECRET_KEY'),\n    })\n\n    // Release any stale advisory locks from previous timeouts\n    await stripeSync.postgresClient.query('SELECT pg_advisory_unlock_all()')\n\n    // Construct webhook URL from SUPABASE_URL (available in all Edge Functions)\n    const supabaseUrl = Deno.env.get('SUPABASE_URL')\n    if (!supabaseUrl) {\n      throw new Error('SUPABASE_URL environment variable is not set')\n    }\n    const webhookUrl = supabaseUrl + '/functions/v1/stripe-webhook'\n\n    const webhook = await stripeSync.findOrCreateManagedWebhook(webhookUrl)\n\n    await stripeSync.postgresClient.pool.end()\n\n    return new Response(\n      JSON.stringify({\n        success: true,\n        message: 'Setup complete',\n        webhookId: webhook.id,\n      }),\n      {\n        status: 200,\n        headers: { 'Content-Type': 'application/json' },\n      }\n    )\n  } catch (error) {\n    console.error('Setup error:', error)\n    // Cleanup on error\n    if (stripeSync) {\n      try {\n        await stripeSync.postgresClient.query('SELECT pg_advisory_unlock_all()')\n        await stripeSync.postgresClient.pool.end()\n      } catch (cleanupErr) {\n        console.warn('Cleanup failed:', cleanupErr)\n      }\n    }\n    return new Response(JSON.stringify({ success: false, error: error.message }), {\n      status: 500,\n      headers: { 'Content-Type': 'application/json' },\n    })\n  }\n})\n";

// raw-ts:/Users/matt/Code/stripe-sync-engine-forked-by-stripe/packages/sync-engine/src/supabase/edge-functions/stripe-webhook.ts
var stripe_webhook_default = "import { StripeSync } from 'npm:stripe-experiment-sync'\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('Method not allowed', { status: 405 })\n  }\n\n  const sig = req.headers.get('stripe-signature')\n  if (!sig) {\n    return new Response('Missing stripe-signature header', { status: 400 })\n  }\n\n  const rawDbUrl = Deno.env.get('SUPABASE_DB_URL')\n  if (!rawDbUrl) {\n    return new Response(JSON.stringify({ error: 'SUPABASE_DB_URL not set' }), { status: 500 })\n  }\n  const dbUrl = rawDbUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '')\n\n  const stripeSync = new StripeSync({\n    poolConfig: { connectionString: dbUrl, max: 1 },\n    stripeSecretKey: Deno.env.get('STRIPE_SECRET_KEY')!,\n  })\n\n  try {\n    const rawBody = new Uint8Array(await req.arrayBuffer())\n    await stripeSync.processWebhook(rawBody, sig)\n    return new Response(JSON.stringify({ received: true }), {\n      status: 200,\n      headers: { 'Content-Type': 'application/json' },\n    })\n  } catch (error) {\n    console.error('Webhook processing error:', error)\n    const isSignatureError =\n      error.message?.includes('signature') || error.type === 'StripeSignatureVerificationError'\n    const status = isSignatureError ? 400 : 500\n    return new Response(JSON.stringify({ error: error.message }), {\n      status,\n      headers: { 'Content-Type': 'application/json' },\n    })\n  } finally {\n    await stripeSync.postgresClient.pool.end()\n  }\n})\n";

// raw-ts:/Users/matt/Code/stripe-sync-engine-forked-by-stripe/packages/sync-engine/src/supabase/edge-functions/stripe-worker.ts
var stripe_worker_default = "/**\n * Stripe Sync Worker\n *\n * Triggered by pg_cron every 10 seconds. Uses pgmq for durable work queue.\n *\n * Flow:\n * 1. Read batch of messages from pgmq (qty=10, vt=60s)\n * 2. If queue empty: enqueue all objects (continuous sync)\n * 3. Process messages in parallel (Promise.all):\n *    - processNext(object)\n *    - Delete message on success\n *    - Re-enqueue if hasMore\n * 4. Return results summary\n *\n * Concurrency:\n * - Multiple workers can run concurrently via overlapping pg_cron triggers.\n * - Each worker processes its batch of messages in parallel (Promise.all).\n * - pgmq visibility timeout prevents duplicate message reads across workers.\n * - processNext() is idempotent (uses internal cursor tracking), so duplicate\n *   processing on timeout/crash is safe.\n */\n\nimport { StripeSync } from 'npm:stripe-experiment-sync'\nimport postgres from 'npm:postgres'\n\nconst QUEUE_NAME = 'stripe_sync_work'\nconst VISIBILITY_TIMEOUT = 60 // seconds\nconst BATCH_SIZE = 10\n\nDeno.serve(async (req) => {\n  const authHeader = req.headers.get('Authorization')\n  if (!authHeader?.startsWith('Bearer ')) {\n    return new Response('Unauthorized', { status: 401 })\n  }\n\n  const rawDbUrl = Deno.env.get('SUPABASE_DB_URL')\n  if (!rawDbUrl) {\n    return new Response(JSON.stringify({ error: 'SUPABASE_DB_URL not set' }), { status: 500 })\n  }\n  const dbUrl = rawDbUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '')\n\n  let sql\n  let stripeSync\n\n  try {\n    sql = postgres(dbUrl, { max: 1, prepare: false })\n  } catch (error) {\n    return new Response(\n      JSON.stringify({\n        error: 'Failed to create postgres connection',\n        details: error.message,\n        stack: error.stack,\n      }),\n      { status: 500, headers: { 'Content-Type': 'application/json' } }\n    )\n  }\n\n  try {\n    stripeSync = new StripeSync({\n      poolConfig: { connectionString: dbUrl, max: 1 },\n      stripeSecretKey: Deno.env.get('STRIPE_SECRET_KEY')!,\n    })\n  } catch (error) {\n    await sql.end()\n    return new Response(\n      JSON.stringify({\n        error: 'Failed to create StripeSync',\n        details: error.message,\n        stack: error.stack,\n      }),\n      { status: 500, headers: { 'Content-Type': 'application/json' } }\n    )\n  }\n\n  try {\n    // Read batch of messages from queue\n    const messages = await sql`\n      SELECT * FROM pgmq.read(${QUEUE_NAME}::text, ${VISIBILITY_TIMEOUT}::int, ${BATCH_SIZE}::int)\n    `\n\n    // If queue empty, enqueue all objects for continuous sync\n    if (messages.length === 0) {\n      const objects = stripeSync.getSupportedSyncObjects()\n      const msgs = objects.map((object) => JSON.stringify({ object }))\n\n      await sql`\n        SELECT pgmq.send_batch(\n          ${QUEUE_NAME}::text,\n          ${sql.array(msgs)}::jsonb[]\n        )\n      `\n\n      return new Response(JSON.stringify({ enqueued: objects.length, objects }), {\n        status: 200,\n        headers: { 'Content-Type': 'application/json' },\n      })\n    }\n\n    // Process messages in parallel\n    const results = await Promise.all(\n      messages.map(async (msg) => {\n        const { object } = msg.message as { object: string }\n\n        try {\n          const result = await stripeSync.processNext(object)\n\n          // Delete message on success (cast to bigint to disambiguate overloaded function)\n          await sql`SELECT pgmq.delete(${QUEUE_NAME}::text, ${msg.msg_id}::bigint)`\n\n          // Re-enqueue if more pages\n          if (result.hasMore) {\n            await sql`SELECT pgmq.send(${QUEUE_NAME}::text, ${sql.json({ object })}::jsonb)`\n          }\n\n          return { object, ...result }\n        } catch (error) {\n          // Log error but continue to next message\n          // Message will become visible again after visibility timeout\n          console.error(`Error processing ${object}:`, error)\n          return {\n            object,\n            processed: 0,\n            hasMore: false,\n            error: error.message,\n            stack: error.stack,\n          }\n        }\n      })\n    )\n\n    return new Response(JSON.stringify({ results }), {\n      status: 200,\n      headers: { 'Content-Type': 'application/json' },\n    })\n  } catch (error) {\n    console.error('Worker error:', error)\n    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {\n      status: 500,\n      headers: { 'Content-Type': 'application/json' },\n    })\n  } finally {\n    if (sql) await sql.end()\n    if (stripeSync) await stripeSync.postgresClient.pool.end()\n  }\n})\n";

// src/supabase/edge-function-code.ts
var setupFunctionCode = stripe_setup_default;
var webhookFunctionCode = stripe_webhook_default;
var workerFunctionCode = stripe_worker_default;

// src/supabase/supabase.ts
var SupabaseDeployClient = class {
  api;
  projectRef;
  constructor(options) {
    this.api = new SupabaseManagementAPI({ accessToken: options.accessToken, baseUrl: "http://localhost:8080" });
    this.projectRef = options.projectRef;
  }
  /**
   * Validate that the project exists and we have access
   */
  async validateProject() {
    const projects = await this.api.getProjects();
    const project = projects?.find((p) => p.id === this.projectRef);
    if (!project) {
      throw new Error(`Project ${this.projectRef} not found or you don't have access`);
    }
    return {
      id: project.id,
      name: project.name,
      region: project.region
    };
  }
  /**
   * Deploy an Edge Function
   */
  async deployFunction(name, code) {
    const functions = await this.api.listFunctions(this.projectRef);
    const exists = functions?.some((f) => f.slug === name);
    if (exists) {
      await this.api.updateFunction(this.projectRef, name, {
        body: code,
        verify_jwt: false
      });
    } else {
      await this.api.createFunction(this.projectRef, {
        slug: name,
        name,
        body: code,
        verify_jwt: false
      });
    }
  }
  /**
   * Set secrets for Edge Functions
   */
  async setSecrets(secrets) {
    await this.api.createSecrets(this.projectRef, secrets);
  }
  /**
   * Run SQL against the database
   */
  async runSQL(sql) {
    return await this.api.runQuery(this.projectRef, sql);
  }
  /**
   * Setup pg_cron job to invoke worker function
   */
  async setupPgCronJob() {
    const serviceRoleKey = await this.getServiceRoleKey();
    const escapedServiceRoleKey = serviceRoleKey.replace(/'/g, "''");
    const sql = `
      -- Enable extensions
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      CREATE EXTENSION IF NOT EXISTS pg_net;
      CREATE EXTENSION IF NOT EXISTS pgmq;

      -- Create pgmq queue for sync work (idempotent)
      SELECT pgmq.create('stripe_sync_work')
      WHERE NOT EXISTS (
        SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'stripe_sync_work'
      );

      -- Store service role key in vault for pg_cron to use
      -- Delete existing secret if it exists, then create new one
      DELETE FROM vault.secrets WHERE name = 'stripe_sync_service_role_key';
      SELECT vault.create_secret('${escapedServiceRoleKey}', 'stripe_sync_service_role_key');

      -- Delete existing jobs if they exist
      SELECT cron.unschedule('stripe-sync-worker') WHERE EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'stripe-sync-worker'
      );
      SELECT cron.unschedule('stripe-sync-scheduler') WHERE EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'stripe-sync-scheduler'
      );

      -- Create job to invoke worker every 10 seconds
      -- Worker reads from pgmq, enqueues objects if empty, and processes sync work
      SELECT cron.schedule(
        'stripe-sync-worker',
        '10 seconds',
        $$
        SELECT net.http_post(
          url := 'https://${this.projectRef}.supabase.red/functions/v1/stripe-worker',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'stripe_sync_service_role_key')
          )
        )
        $$
      );
    `;
    await this.runSQL(sql);
  }
  /**
   * Get the webhook URL for this project
   */
  getWebhookUrl() {
    return `https://${this.projectRef}.supabase.red/functions/v1/stripe-webhook`;
  }
  /**
   * Get the service role key for this project (needed to invoke Edge Functions)
   */
  async getServiceRoleKey() {
    const apiKeys = await this.api.getProjectApiKeys(this.projectRef);
    const serviceRoleKey = apiKeys?.find((k) => k.name === "service_role");
    if (!serviceRoleKey) {
      throw new Error("Could not find service_role API key");
    }
    return serviceRoleKey.api_key;
  }
  /**
   * Get the anon key for this project (needed for Realtime subscriptions)
   */
  async getAnonKey() {
    const apiKeys = await this.api.getProjectApiKeys(this.projectRef);
    const anonKey = apiKeys?.find((k) => k.name === "anon");
    if (!anonKey) {
      throw new Error("Could not find anon API key");
    }
    return anonKey.api_key;
  }
  /**
   * Get the project URL
   */
  getProjectUrl() {
    return `https://${this.projectRef}.supabase.red`;
  }
  /**
   * Invoke an Edge Function
   */
  async invokeFunction(name, serviceRoleKey) {
    const url = `https://${this.projectRef}.supabase.red/functions/v1/${name}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `${response.status}: ${text}` };
    }
    const result = await response.json();
    if (result.success === false) {
      return { success: false, error: result.error };
    }
    return { success: true };
  }
};
async function install(params) {
  const { supabaseAccessToken, supabaseProjectRef, stripeKey } = params;
  const trimmedStripeKey = stripeKey.trim();
  if (!trimmedStripeKey.startsWith("sk_") && !trimmedStripeKey.startsWith("rk_")) {
    throw new Error('Stripe key should start with "sk_" or "rk_"');
  }
  const client = new SupabaseDeployClient({
    accessToken: supabaseAccessToken,
    projectRef: supabaseProjectRef
  });
  await client.validateProject();
  await client.deployFunction("stripe-setup", setupFunctionCode);
  await client.deployFunction("stripe-webhook", webhookFunctionCode);
  await client.deployFunction("stripe-worker", workerFunctionCode);
  await client.setSecrets([{ name: "STRIPE_SECRET_KEY", value: trimmedStripeKey }]);
  const serviceRoleKey = await client.getServiceRoleKey();
  const setupResult = await client.invokeFunction("stripe-setup", serviceRoleKey);
  if (!setupResult.success) {
    throw new Error(`Setup failed: ${setupResult.error}`);
  }
  try {
    await client.setupPgCronJob();
  } catch {
  }
}
export {
  SupabaseDeployClient,
  install,
  setupFunctionCode,
  webhookFunctionCode,
  workerFunctionCode
};
