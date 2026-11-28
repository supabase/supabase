import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const { billingAll: billingEnabled } = isFeatureEnabled(['billing:all'])

export const functions: NavMenuConstant = {
  icon: 'edge-functions',
  title: 'Edge Functions',
  url: '/guides/functions',
  items: [
    {
      name: 'Getting started',
      items: [
        { name: 'Quickstart (Dashboard)', url: '/guides/functions/quickstart-dashboard' },
        { name: 'Quickstart (CLI)', url: '/guides/functions/quickstart' },
        { name: 'Development environment', url: '/guides/functions/development-environment' },
        { name: 'Architecture', url: '/guides/functions/architecture' },
      ],
    },
    {
      name: 'Develop and configure',
      items: [
        { name: 'Environment variables', url: '/guides/functions/secrets' },
        { name: 'Managing dependencies', url: '/guides/functions/dependencies' },
        { name: 'Function configuration', url: '/guides/functions/function-configuration' },
        { name: 'Routing', url: '/guides/functions/routing' },
        { name: 'Error handling', url: '/guides/functions/error-handling' },
        { name: 'CORS for browser calls', url: '/guides/functions/cors' },
        { name: 'Deploy to production', url: '/guides/functions/deploy' },
      ],
    },
    {
      name: 'Runtime features',
      items: [
        { name: 'Background tasks', url: '/guides/functions/background-tasks' },
        { name: 'File storage (ephemeral)', url: '/guides/functions/ephemeral-storage' },
        { name: 'WebSockets', url: '/guides/functions/websockets' },
        { name: 'Wasm modules', url: '/guides/functions/wasm' },
        { name: 'AI models', url: '/guides/functions/ai-models' },
        { name: 'Recursive function calls', url: '/guides/functions/recursive-functions' },
      ],
    },
    {
      name: 'Debugging',
      items: [
        { name: 'Debug locally with DevTools', url: '/guides/functions/debugging-tools' },
        { name: 'Testing your Functions', url: '/guides/functions/unit-test' },
        { name: 'Logging', url: '/guides/functions/logging' },
        { name: 'Error codes', url: '/guides/functions/error-codes' },
        { name: 'Status codes', url: '/guides/functions/status-codes' },
      ],
    },
    {
      name: 'Limits, regions and pricing',
      items: [
        { name: 'Regional invocations', url: '/guides/functions/regional-invocation' },
        { name: 'Limits', url: '/guides/functions/limits', enabled: billingEnabled },
        { name: 'Pricing', url: '/guides/functions/pricing', enabled: billingEnabled },
      ],
    },
    {
      name: 'Auth, Database and Storage',
      items: [
        {
          name: 'Supabase Auth',
          items: [
            { name: 'Securing your functions', url: '/guides/functions/auth' },
            { name: 'Authorization headers', url: '/guides/functions/auth-headers' },
            { name: 'Legacy JWT secret', url: '/guides/functions/auth-legacy-jwt' },
          ],
        },
        { name: 'Supabase Database (Postgres)', url: '/guides/functions/connect-to-postgres' },
        { name: 'Supabase Storage', url: '/guides/functions/storage-caching' },
      ],
    },
    {
      name: 'Examples and tools',
      items: [
        {
          name: 'AI and MCP',
          items: [
            {
              name: 'MCP server with mcp-lite',
              url: '/guides/functions/examples/mcp-server-mcp-lite',
            },
            {
              name: 'Generating AI images',
              url: '/guides/functions/examples/amazon-bedrock-image-generator',
            },
            { name: 'Semantic AI search', url: '/guides/functions/examples/semantic-search' },
            {
              name: 'ElevenLabs text to speech',
              url: '/guides/functions/examples/elevenlabs-generate-speech-stream',
            },
            {
              name: 'ElevenLabs speech to text',
              url: '/guides/functions/examples/elevenlabs-transcribe-speech',
            },
          ],
        },
        {
          name: 'Bots, email, notifications',
          items: [
            { name: 'Building a Discord bot', url: '/guides/functions/examples/discord-bot' },
            { name: 'Building a Telegram bot', url: '/guides/functions/examples/telegram-bot' },
            {
              name: 'Slack bot for mentions',
              url: '/guides/functions/examples/slack-bot-mention',
            },
            {
              name: 'Sending push notifications',
              url: '/guides/functions/examples/push-notifications',
            },
            {
              name: 'React Email auth hook',
              url: '/guides/functions/examples/auth-send-email-hook-react-email-resend',
            },
            { name: 'Sending emails with Resend', url: '/guides/functions/examples/send-emails' },
          ],
        },
        {
          name: 'Images and screenshots',
          items: [
            { name: 'Generating OG images', url: '/guides/functions/examples/og-image' },
            {
              name: 'Optimize images',
              url: '/guides/functions/examples/image-manipulation',
            },
            {
              name: 'Puppeteer screenshots',
              url: '/guides/functions/examples/screenshots',
            },
          ],
        },
        {
          name: 'Payments, CAPTCHA, limits',
          items: [
            {
              name: 'Handling Stripe webhooks',
              url: '/guides/functions/examples/stripe-webhooks',
            },
            {
              name: 'Cloudflare Turnstile CAPTCHA',
              url: '/guides/functions/examples/cloudflare-turnstile',
            },
            { name: 'Rate-limiting with Redis', url: '/guides/functions/examples/rate-limiting' },
          ],
        },
        {
          name: 'Libraries and tools',
          items: [
            { name: 'Dart Edge on Supabase', url: '/guides/functions/dart-edge' },
            { name: 'Type-safe SQL with Kysely', url: '/guides/functions/kysely-postgres' },
            { name: 'Upstash Redis', url: '/guides/functions/examples/upstash-redis' },
            {
              name: 'Monitoring with Sentry',
              url: '/guides/functions/examples/sentry-monitoring',
            },
            {
              name: 'Resumable WebSockets',
              url: '/guides/functions/examples/resumable-websockets',
            },
          ],
        },
      ],
    },
  ],
}
