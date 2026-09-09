import type { BlockArchitectureDefinition } from '@/lib/block-architecture'

// Template architecture is declared separately from registry file manifests:
// these are key resources, not an exhaustive inventory of scaffolded files.
// Sources: https://github.com/supabase-community/nextjs-subscription-payments
// https://github.com/supabase-community/vercel-ai-chatbot
// https://github.com/supabase/supabase/tree/master/examples/user-management/flutter-user-management
export const starterArchitectureDefinitions: BlockArchitectureDefinition[] = [
  {
    name: 'saas-starter',
    title: 'SaaS Starter',
    meta: {
      architecture: {
        resources: [
          {
            id: 'pricing',
            label: 'Pricing',
            kind: 'page',
            route: '/',
            description: 'app/page.tsx — displays products, prices, and the current subscription.',
          },
          {
            id: 'account',
            label: 'Account',
            kind: 'page',
            route: '/account',
            description: 'app/account/page.tsx — profile details and the customer portal.',
          },
          {
            id: 'signin',
            label: 'Authentication pages',
            kind: 'page',
            route: '/signin/[id]',
            description:
              'app/signin/[id]/page.tsx — sign-in, sign-up, and password recovery views.',
          },
          {
            id: 'callback',
            label: 'Auth callback',
            kind: 'route',
            route: '/auth/callback',
            description:
              'app/auth/callback/route.ts — exchanges an authorization code for a session.',
          },
          {
            id: 'reset',
            label: 'Password recovery callback',
            kind: 'route',
            route: '/auth/reset_password',
            description: 'app/auth/reset_password/route.ts — opens the password update view.',
          },
          {
            id: 'billing',
            label: 'Billing server actions',
            kind: 'capability',
            description: 'utils/stripe/server.ts — creates Checkout and customer portal sessions.',
          },
          {
            id: 'webhooks',
            label: 'Stripe webhook',
            kind: 'route',
            route: '/api/webhooks',
            description: 'app/api/webhooks/route.ts — verifies and processes Stripe events.',
          },
          ...[
            ['users', 'Profile and billing details linked to auth.users.'],
            ['customers', 'Private mapping between user IDs and Stripe customer IDs.'],
            ['products', 'Product catalog synchronized from Stripe.'],
            ['prices', 'Product prices synchronized from Stripe.'],
            ['subscriptions', 'Customer subscription status synchronized from Stripe.'],
          ].map(([name, description]) => ({
            id: name,
            label: `public.${name}`,
            kind: 'table' as const,
            description: `supabase/migrations/20230530034630_init.sql — ${description}`,
          })),
          {
            id: 'auth',
            label: 'Supabase Auth',
            kind: 'service',
            status: 'existing',
            description:
              'Authenticates users and creates their public.users profile through a trigger.',
          },
          {
            id: 'stripe',
            label: 'Stripe',
            kind: 'service',
            status: 'existing',
            description: 'Provides Checkout, the customer portal, and billing events.',
          },
        ],
        relationships: [
          { source: 'pricing', target: 'products', label: 'Reads catalog' },
          { source: 'pricing', target: 'prices', label: 'Reads prices' },
          { source: 'pricing', target: 'billing', label: 'Starts checkout' },
          { source: 'account', target: 'billing', label: 'Opens customer portal' },
          { source: 'account', target: 'users', label: 'Reads profile' },
          { source: 'account', target: 'subscriptions', label: 'Reads current plan' },
          { source: 'signin', target: 'auth', label: 'Authenticates' },
          { source: 'callback', target: 'auth', label: 'Exchanges code' },
          { source: 'reset', target: 'auth', label: 'Exchanges recovery code' },
          { source: 'reset', target: 'signin', label: 'Opens password update' },
          { source: 'auth', target: 'users', label: 'Creates profile on sign-up' },
          { source: 'billing', target: 'customers', label: 'Resolves billing customer' },
          { source: 'billing', target: 'stripe', label: 'Creates billing sessions' },
          { source: 'stripe', target: 'webhooks', label: 'Sends events' },
          { source: 'webhooks', target: 'products', label: 'Synchronizes products' },
          { source: 'webhooks', target: 'prices', label: 'Synchronizes prices' },
          { source: 'webhooks', target: 'subscriptions', label: 'Synchronizes subscriptions' },
        ],
      },
    },
  },
  {
    name: 'ai-chat-app',
    title: 'AI Chat App',
    meta: {
      architecture: {
        resources: [
          {
            id: 'new-chat',
            label: 'New chat',
            kind: 'page',
            route: '/',
            description: 'app/page.tsx — starts a conversation with the shared Chat component.',
          },
          {
            id: 'chat',
            label: 'Saved conversation',
            kind: 'page',
            route: '/chat/[id]',
            description:
              'app/chat/[id]/page.tsx — loads a conversation belonging to the signed-in user.',
          },
          {
            id: 'share',
            label: 'Shared conversation',
            kind: 'page',
            route: '/share/[id]',
            description: 'app/share/[id]/page.tsx — reads conversations with a saved share path.',
          },
          {
            id: 'signin',
            label: 'Sign in',
            kind: 'page',
            route: '/sign-in',
            description: 'app/sign-in/page.tsx — email and provider sign-in.',
          },
          {
            id: 'signup',
            label: 'Sign up',
            kind: 'page',
            route: '/sign-up',
            description: 'app/sign-up/page.tsx — account registration.',
          },
          {
            id: 'callback',
            label: 'Auth callback',
            kind: 'route',
            route: '/api/auth/callback',
            description: 'app/api/auth/callback/route.ts — exchanges a code for a session.',
          },
          {
            id: 'chat-api',
            label: 'Chat API',
            kind: 'route',
            route: '/api/chat',
            description:
              'app/api/chat/route.ts — Next.js edge runtime route that streams and saves replies.',
          },
          {
            id: 'history',
            label: 'Conversation server actions',
            kind: 'capability',
            description: 'app/actions.ts — loads, deletes, and shares conversations.',
          },
          {
            id: 'chats',
            label: 'public.chats',
            kind: 'table',
            description:
              'supabase/migrations/20230707053030_init.sql — conversation payloads and ownership policies.',
          },
          {
            id: 'auth',
            label: 'Supabase Auth',
            kind: 'service',
            status: 'existing',
            description: 'Authenticates users before accessing their conversations.',
          },
          {
            id: 'model',
            label: 'OpenAI',
            kind: 'service',
            status: 'existing',
            description: 'Provides streaming Chat Completions for the server route.',
          },
        ],
        relationships: [
          { source: 'new-chat', target: 'chat-api', label: 'Sends messages' },
          { source: 'chat', target: 'chat-api', label: 'Continues conversation' },
          { source: 'chat', target: 'history', label: 'Loads conversation' },
          { source: 'share', target: 'history', label: 'Loads shared conversation' },
          { source: 'history', target: 'chats', label: 'Reads and updates history' },
          { source: 'chat-api', target: 'chats', label: 'Saves completed replies' },
          { source: 'chat-api', target: 'model', label: 'Streams completion' },
          { source: 'chat-api', target: 'auth', label: 'Checks session' },
          { source: 'signin', target: 'auth', label: 'Authenticates' },
          { source: 'signup', target: 'auth', label: 'Registers account' },
          { source: 'callback', target: 'auth', label: 'Exchanges code' },
        ],
      },
    },
  },
  {
    name: 'flutter-starter',
    title: 'Flutter Starter',
    meta: {
      architecture: {
        resources: [
          {
            id: 'app',
            label: 'Flutter app',
            kind: 'capability',
            description:
              'lib/main.dart — initializes Supabase and selects the login or account screen.',
          },
          {
            id: 'login',
            label: 'Sign-in screen',
            kind: 'page',
            description:
              'lib/pages/login_page.dart — requests magic links and listens for sign-in.',
          },
          {
            id: 'account',
            label: 'Account screen',
            kind: 'page',
            description:
              'lib/pages/account_page.dart — edits the profile and saves the avatar URL.',
          },
          {
            id: 'avatar',
            label: 'Avatar upload',
            kind: 'component',
            description: 'lib/components/avatar.dart — picks an image and uploads it to Storage.',
          },
          {
            id: 'profiles',
            label: 'public.profiles',
            kind: 'table',
            description:
              'supabase/migrations/20240404030631_init.sql — profile fields and ownership policies.',
          },
          {
            id: 'avatars',
            label: 'avatars',
            kind: 'bucket',
            description:
              'supabase/migrations/20240404030631_init.sql — avatar bucket and Storage policies.',
          },
          {
            id: 'auth',
            label: 'Supabase Auth',
            kind: 'service',
            status: 'existing',
            description: 'Sends magic links and supplies the current user session.',
          },
        ],
        relationships: [
          { source: 'app', target: 'login', label: 'Opens when signed out' },
          { source: 'app', target: 'account', label: 'Opens when signed in' },
          { source: 'login', target: 'auth', label: 'Requests magic link' },
          { source: 'login', target: 'account', label: 'Opens after sign-in' },
          { source: 'account', target: 'profiles', label: 'Reads and saves profile' },
          { source: 'account', target: 'avatar', label: 'Displays upload control' },
          { source: 'avatar', target: 'avatars', label: 'Uploads image' },
        ],
      },
    },
  },
]
