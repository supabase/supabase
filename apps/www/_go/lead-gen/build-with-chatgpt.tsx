import type { GoPageInput } from 'marketing'
import { Button } from 'ui'

export const buildWithChatgpt: GoPageInput = {
  template: 'lead-gen',
  slug: 'build-with-chatgpt',
  metadata: {
    title: 'Build your app with ChatGPT',
    description:
      'Build with ChatGPT and give your app a Postgres database, user accounts, file uploads, and live updates with Supabase.',
    noIndex: true,
  },
  hero: {
    title: 'Build your app with ChatGPT and Supabase',
    description:
      'Give your app a backend. Supabase brings together a Postgres database, user accounts, file uploads, and live updates in one project.',
    ctas: [
      {
        label: 'Start your project',
        href: 'https://supabase.com/dashboard/sign-up',
        variant: 'primary',
      },
      {
        label: 'Read the docs',
        href: 'https://supabase.com/docs/guides/getting-started',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      title: 'Your app’s backend, in one project',
      columns: 2,
      items: [
        {
          title: 'Postgres Database',
          description:
            'Save your app’s data in a Postgres database. Store and query everything from user profiles to project records.',
        },
        {
          title: 'Authentication',
          description:
            'Let people sign up and sign in to your app. Control which data each user can access.',
        },
        {
          title: 'Storage',
          description:
            'Let users upload images, documents, and other files. Store them and make them available in your app.',
        },
        {
          title: 'Realtime',
          description:
            'Show updates as your app’s data changes. Keep dashboards, notifications, and collaborative features current without refreshing.',
        },
      ],
    },
    {
      type: 'single-column',
      title: 'Connect Supabase directly to ChatGPT',
      description:
        'You can also use the Supabase app in ChatGPT to create tables, update your database, and deploy backend functions from your conversation.',
      children: (
        <div className="flex flex-col items-center gap-4 text-center">
          <Button asChild variant="default" size="medium">
            <a href="https://chatgpt.com/apps/supabase/asdk_app_69d3e5ee6a708191baa733f7b8931995">
              Connect Supabase to ChatGPT
            </a>
          </Button>
          <p className="max-w-xl text-sm text-foreground-light">
            Connecting is optional. Check availability for your ChatGPT plan.
          </p>
          <a
            href="https://supabase.com/blog/supabase-is-now-an-official-chatgpt-app"
            className="text-sm text-foreground-light underline underline-offset-4 hover:text-foreground"
          >
            Integration details →
          </a>
        </div>
      ),
    },
    {
      type: 'single-column',
      title: 'Give your app a backend',
      description: 'Start a Supabase project for the app you’re building.',
      children: (
        <div className="flex justify-center">
          <Button asChild variant="primary" size="medium">
            <a href="https://supabase.com/dashboard/sign-up">Start your project</a>
          </Button>
        </div>
      ),
    },
  ],
}
