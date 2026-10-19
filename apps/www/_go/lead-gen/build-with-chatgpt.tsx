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
      'Give your app user accounts, saved data, file uploads, and live updates. Build with ChatGPT, with Supabase powering your app.',
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
      title: 'Why build with Supabase?',
      columns: 2,
      items: [
        {
          title: 'Postgres Database',
          description: 'Store and query your app data in a full Postgres database.',
        },
        {
          title: 'Authentication',
          description:
            'Add signup and login with Supabase Auth. Control which data each user can access.',
        },
        {
          title: 'Storage',
          description: 'Upload and serve images, documents, and other files.',
        },
        {
          title: 'Realtime',
          description: 'Keep users updated as app data changes, without refreshing.',
        },
      ],
    },
    {
      type: 'single-column',
      title: 'Connect Supabase directly to ChatGPT',
      description:
        'Use the Supabase app to create tables, update your database, and deploy backend functions directly from your ChatGPT conversation.',
      children: (
        <div className="flex flex-col items-center gap-4 text-center">
          <Button asChild variant="default" size="medium">
            <a href="https://chatgpt.com/apps/supabase/asdk_app_69d3e5ee6a708191baa733f7b8931995">
              Connect Supabase to ChatGPT
            </a>
          </Button>
          <p className="max-w-xl text-sm text-foreground-light">
            Connecting is optional. Check availability for your ChatGPT plan before connecting.
          </p>
          <a
            href="https://supabase.com/blog/supabase-is-now-an-official-chatgpt-app"
            className="text-sm text-foreground-light underline underline-offset-4 hover:text-foreground"
          >
            Integration details
          </a>
        </div>
      ),
    },
    {
      type: 'single-column',
      title: 'Put your next idea to work',
      description: 'Bring your app idea to ChatGPT. Build it with Supabase.',
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
