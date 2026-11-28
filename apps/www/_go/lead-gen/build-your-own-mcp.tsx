import type { GoPageInput } from 'marketing'
import { Button } from 'ui'

export const buildYourOwnMcp: GoPageInput = {
  template: 'lead-gen',
  slug: 'build-your-own-mcp',
  metadata: {
    title: 'Build and host your own MCP server',
    description:
      'Host your app’s MCP server on Supabase. Let users connect through ChatGPT and other AI tools with Supabase Auth and their existing data permissions.',
    noIndex: true,
  },
  hero: {
    title: 'Build and host your own MCP server on Supabase',
    description:
      'Let users access your app through ChatGPT and other AI tools. Host your MCP server on Edge Functions, with Supabase Auth for their existing accounts and database policies for data access.',
    ctas: [
      {
        label: 'Start your project',
        href: 'https://supabase.com/dashboard/sign-up',
        variant: 'primary',
      },
      {
        label: 'Read the MCP guide',
        href: 'https://supabase.com/docs/guides/ai-tools/byo-mcp',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      title: 'Your app’s features, available through AI tools',
      columns: 2,
      items: [
        {
          title: 'Expose the actions your users need',
          description:
            'Define MCP tools for your app, such as finding a record or creating a task. You choose which actions to make available.',
        },
        {
          title: 'Host on Edge Functions',
          description:
            'Deploy your MCP server as a Supabase Edge Function and give compatible AI tools an HTTPS endpoint to connect to.',
        },
        {
          title: 'Use existing user accounts',
          description:
            'With Supabase Auth, users sign in to their existing app accounts and approve access through an OAuth consent flow.',
        },
        {
          title: 'Keep access tied to the user',
          description:
            'Run database queries as the signed-in user so your Row Level Security policies control which data each tool call can access.',
        },
      ],
    },
    {
      type: 'steps',
      title: 'From app features to MCP tools',
      items: [
        {
          title: 'Define your tools',
          description: 'Choose the app actions to expose and implement them in your MCP server.',
        },
        {
          title: 'Connect sign-in and permissions',
          description:
            'Configure Supabase Auth, add a consent screen, and use the caller’s identity for database access.',
        },
        {
          title: 'Deploy and connect',
          description:
            'Deploy to Edge Functions, then connect from a compatible MCP client to test sign-in and tool calls.',
        },
      ],
    },
    {
      type: 'single-column',
      title: 'Let users bring your app into their AI workflow',
      description:
        'Start a Supabase project or follow the MCP guide to add a server to your existing app.',
      children: (
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild variant="primary" size="medium">
            <a href="https://supabase.com/dashboard/sign-up">Start your project</a>
          </Button>
          <Button asChild variant="default" size="medium">
            <a href="https://supabase.com/docs/guides/ai-tools/byo-mcp">Read the MCP guide</a>
          </Button>
        </div>
      ),
    },
  ],
}
