import { setupCommand } from '~/components/HomePageCover.constants'
import { PROD_URL } from '~/lib/constants'

import { CREATE_PROJECT_URL, EXPLORE_ITEMS } from './GettingStarted.data'

const toMarkdownUrl = (href: string) => `${PROD_URL}${href}.md`

export const buildPrompt = (features: string[]): string => {
  const selected = EXPLORE_ITEMS.filter((item) => features.includes(item.id))
  const productGuides = EXPLORE_ITEMS.filter((item) => item.id !== 'ai-tools')
    .map((item) => `${item.feature} (${toMarkdownUrl(item.href)})`)
    .join(', ')
  const featureLines =
    selected.length > 0
      ? selected.map((item) => `Set up ${item.feature}. Follow ${toMarkdownUrl(item.href)}.`)
      : [`Ask me which features I need, then follow the matching guides: ${productGuides}.`]
  const lines = [
    'Find the framework and language of my app from its project files, such as `package.json`, `pubspec.yaml`, or `Package.swift`. If the folder has no app, ask what I want to build, then suggest a framework and wait for my choice.',
    // the npm install needs a Node.js project, which other SDKs do not have
    `Install the Supabase CLI. In a Node.js project, install it as a dev dependency with \`${setupCommand.installCli}\`. Otherwise, use the method for my operating system from ${toMarkdownUrl('/guides/local-development/cli/getting-started')}.`,
    `Install the Supabase plugin with \`${setupCommand.installPlugin}\`.`,
    `If I do not have a Supabase project, ask whether I want a hosted project (${CREATE_PROJECT_URL}) or a local one (\`supabase init\`, then \`supabase start\`). In a Node.js project, put \`npx\` before each command.`,
    `Connect my app. Follow the quickstart for its framework from ${toMarkdownUrl('/guides/getting-started')}.`,
    ...featureLines,
    'Check the connection. Create a `todos` table with a `title` column and one row, and enable Row Level Security with a policy that lets anyone read it. Then read the row from my app and show its title, and ask whether I want to keep the `todos` table or drop it.',
    'Finish by telling me what you changed and how to run my app.',
  ]

  return [
    'Help me set up Supabase in my app. Before you create a project or change my files, tell me your plan and wait for my go-ahead. Do the following:',
    ...lines.map((line, index) => `${index + 1}. ${line}`),
  ].join('\n')
}
