import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const functionsGetStarted: ContentListingGroup = {
  id: 'functions-get-started',
  heading: 'Get started',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Edge Functions quickstart',
      href: '/guides/functions/quickstart',
      description: 'Create, test, and deploy your first Edge Function with the Supabase CLI.',
    },
  ],
}

export const functionsExamplesSupabase: ContentListingGroup = {
  id: 'functions-examples-supabase',
  heading: 'Supabase integration',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'With supabase-js',
      href: '/guides/functions/auth',
      description: 'Use the Supabase client inside your Edge Function.',
    },
    {
      title: 'Connect to Postgres',
      href: '/guides/functions/connect-to-postgres',
      description: 'Connect to Postgres from Edge Functions.',
    },
    {
      title: 'Type-Safe SQL with Kysely',
      href: '/guides/functions/kysely-postgres',
      description:
        'Combine Kysely with Deno Postgres for a convenient developer experience when interacting directly with your Postgres database.',
    },
    {
      title: 'With CORS headers',
      href: '/guides/functions/cors',
      description: 'Send CORS headers for invoking from the browser.',
    },
    {
      title: 'Building a RESTful Service API',
      href: 'https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/restful-tasks/index.ts',
      icon: '/docs/img/icons/github-icon',
      description:
        'Learn how to use HTTP methods and paths to build a RESTful service for managing tasks.',
    },
    {
      title: 'Oak Server Middleware',
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/oak-server',
      icon: '/docs/img/icons/github-icon',
      description: 'Route requests with Oak server middleware.',
    },
    {
      title: 'Web Stream',
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/streams',
      icon: '/docs/img/icons/github-icon',
      description: 'Stream Server-Sent Events from Edge Functions.',
    },
    {
      title: 'Get User Location',
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/location',
      icon: '/docs/img/icons/github-icon',
      description: "Get user location data from user's IP address.",
    },
    {
      title: 'Working with Supabase Storage',
      href: 'https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/read-storage/index.ts',
      icon: '/docs/img/icons/github-icon',
      description: 'Read a file from Supabase Storage.',
    },
    {
      title: 'Upload File',
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/file-upload-storage',
      icon: '/docs/img/icons/github-icon',
      description: 'Process multipart/form-data.',
    },
  ],
}

export const functionsExamplesWebhooksPayments: ContentListingGroup = {
  id: 'functions-examples-webhooks-payments',
  heading: 'Webhooks & payments',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Stripe Webhooks',
      href: '/guides/functions/examples/stripe-webhooks',
      description: 'Handle signed Stripe webhooks with Edge Functions.',
    },
    {
      title: 'React Native with Stripe',
      href: 'https://github.com/supabase-community/expo-stripe-payments-with-supabase-functions',
      icon: '/docs/img/icons/github-icon',
      description: 'Use Supabase and Stripe in a React Native app with Expo.',
    },
    {
      title: 'Flutter with Stripe',
      href: 'https://github.com/supabase-community/flutter-stripe-payments-with-supabase-functions',
      icon: '/docs/img/icons/github-icon',
      description: 'Use Supabase and Stripe in a Flutter app.',
    },
  ],
}

export const functionsExamplesAiMedia: ContentListingGroup = {
  id: 'functions-examples-ai-media',
  heading: 'AI & media',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Hugging Face',
      href: '/guides/ai/examples/huggingface-image-captioning',
      description: 'Access 100,000+ Machine Learning models.',
    },
    {
      title: 'OpenAI',
      href: '/guides/ai/examples/openai',
      description: 'Use OpenAI in Edge Functions.',
    },
    {
      title: 'Amazon Bedrock',
      href: '/guides/functions/examples/amazon-bedrock-image-generator',
      description: 'Generate images with Amazon Bedrock in Edge Functions.',
    },
    {
      title: 'Open Graph Image Generation',
      href: '/guides/functions/examples/og-image',
      description: 'Generate Open Graph images with Deno and Supabase Edge Functions.',
    },
    {
      title: 'OG Image Generation & Storage CDN Caching',
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/og-image-with-storage-cdn',
      icon: '/docs/img/icons/github-icon',
      description: 'Cache generated images with Supabase Storage CDN.',
    },
    {
      title: 'Puppeteer',
      href: '/guides/functions/examples/screenshots',
      description: 'Generate screenshots with Puppeteer.',
    },
  ],
}

export const functionsExamplesMessaging: ContentListingGroup = {
  id: 'functions-examples-messaging',
  heading: 'Bots & email',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Send emails',
      href: '/guides/functions/examples/send-emails',
      description: 'Send emails in Edge Functions with Resend.',
    },
    {
      title: 'Discord Bot',
      href: '/guides/functions/examples/discord-bot',
      description: 'Build a slash command Discord bot with Edge Functions.',
    },
    {
      title: 'Telegram Bot',
      href: '/guides/functions/examples/telegram-bot',
      description: 'Build a Telegram bot with Edge Functions.',
    },
    {
      title: 'Slack Bot Mention Edge Function',
      href: '/guides/functions/examples/slack-bot-mention',
      description: 'Handle Slack mentions in a Slack bot Edge Function.',
    },
  ],
}

export const functionsExamplesOperations: ContentListingGroup = {
  id: 'functions-examples-operations',
  heading: 'Operations & security',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Monitoring with Sentry',
      href: '/guides/functions/examples/sentry-monitoring',
      description: 'Monitor Edge Functions with the Sentry Deno SDK.',
    },
    {
      title: 'GitHub Actions',
      href: '/guides/functions/examples/github-actions',
      description: 'Deploy Edge Functions with GitHub Actions.',
    },
    {
      title: 'Upstash Redis',
      href: '/guides/functions/examples/upstash-redis',
      description: 'Build an Edge Functions Counter with Upstash Redis.',
    },
    {
      title: 'Rate Limiting',
      href: '/guides/functions/examples/rate-limiting',
      description: 'Rate-limit Edge Functions with Upstash Redis.',
    },
    {
      title: 'Cloudflare Turnstile',
      href: '/guides/functions/examples/cloudflare-turnstile',
      description: 'Protect forms with Cloudflare Turnstile.',
    },
  ],
}
