[Stripe](https://stripe.com/) is an API-driven payment processing and subscription management platform.

The Stripe Sync Engine syncs customers, subscriptions, invoices, payments, and other Stripe objects into a dedicated `stripe` schema in your Supabase database. New events are captured in real time through Stripe webhooks, and historical data is backfilled incrementally using Supabase Queues, so you can join Stripe data with your application data directly in SQL.

The Sync Engine is open source under the Apache 2.0 license at [github.com/stripe/sync-engine](https://github.com/stripe/sync-engine).
