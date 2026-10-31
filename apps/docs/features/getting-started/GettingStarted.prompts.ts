import { setupCommand } from '~/components/HomePageCover.constants'
import { PROD_URL } from '~/lib/constants'

import { EXPLORE_ITEMS } from './GettingStarted.data'
import { getFramework } from './GettingStarted.frameworks'

interface BuildPromptParams {
  fw: string | null
  features: string[]
}

const toMarkdownUrl = (href: string) => `${PROD_URL}${href}.md`

export const buildPrompt = ({ fw, features }: BuildPromptParams): string => {
  const framework = getFramework(fw)
  const app = framework ? `${framework.name} app` : 'app'
  const selected = EXPLORE_ITEMS.filter((item) => features.includes(item.id))
  const productGuides = EXPLORE_ITEMS.filter((item) => item.id !== 'mcp')
    .map((item) => `${item.name} (${toMarkdownUrl(item.href)})`)
    .join(', ')
  const featureLines =
    selected.length > 0
      ? selected.map((item) => `Set up ${item.name}. Follow ${toMarkdownUrl(item.href)}.`)
      : [`Ask me which features I need, then follow the matching guides: ${productGuides}.`]
  const lines = [
    // the npm install needs a Node.js project, which other SDKs do not have
    framework?.sdk === 'js'
      ? `Install the Supabase CLI as a dev dependency with \`${setupCommand.installCli}\`.`
      : `Install the Supabase CLI with the method for my operating system. Follow ${toMarkdownUrl('/guides/local-development/cli/getting-started')}.`,
    `Install the Supabase plugin with \`${setupCommand.installPlugin}\`.`,
    'If I do not have a Supabase project, ask whether I want a hosted project (https://supabase.com/dashboard/new) or a local one (`npx supabase init`, then `npx supabase start`).',
    framework
      ? `Connect my ${app}. Follow ${toMarkdownUrl(framework.href)}.`
      : `Connect my app. Find the quickstart for my framework in ${toMarkdownUrl('/guides/getting-started')}.`,
    ...featureLines,
    'Finish by telling me what you changed and how to run my app.',
  ]

  return [
    `Help me set up Supabase in my ${app}. Before you create a project or change my files, tell me your plan and wait for my go-ahead. Do the following:`,
    ...lines.map((line, index) => `${index + 1}. ${line}`),
  ].join('\n')
}

export const buildVerifyPrompt = (fw: string | null): string => {
  const framework = getFramework(fw)
  const app = framework ? `${framework.name} app` : 'app'
  return [
    `Check that my ${app} is connected to Supabase:`,
    '1. Create a `todos` table with a `title` column, and add one row.',
    '2. Enable Row Level Security on `todos`, with a policy that lets anyone read it.',
    '3. Read the row from my app and show its title.',
    '4. Run the app and tell me what you see.',
  ].join('\n')
}
