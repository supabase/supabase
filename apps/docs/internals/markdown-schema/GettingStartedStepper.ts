import {
  DEFAULT_CHOICES,
  EXPLORE_ITEMS,
  getTutorialStep,
  LOCAL_COMMANDS,
  NEXT_STEPS,
} from '~/features/getting-started/GettingStarted.data'
import { FRAMEWORK_GROUPS, FRAMEWORKS } from '~/features/getting-started/GettingStarted.frameworks'
import { buildPrompt, buildVerifyPrompt } from '~/features/getting-started/GettingStarted.prompts'

import { getInternalLinkBaseUrl, withDocsBasePath } from '../internal-links'

// the page is interactive, so the export lists every path
export const GettingStartedStepper = (): string => {
  const baseUrl = getInternalLinkBaseUrl()
  const toUrl = (href: string) => `${baseUrl}${withDocsBasePath(href)}`
  const fence = (lang: string, code: string) => [`\`\`\`${lang}`, code, '```'].join('\n')

  return [
    'Create a Supabase project and connect it to your app. Start with an AI agent, the Supabase CLI, or the Supabase Dashboard.',
    '## Start with an AI agent',
    'Copy this prompt into your agent:',
    fence('text', buildPrompt(DEFAULT_CHOICES)),
    'When your agent finishes, send this prompt to check that your app reads data from your project:',
    fence('text', buildVerifyPrompt(DEFAULT_CHOICES.fw)),
    '## Run Supabase locally',
    'Install the Supabase CLI, initialize your project, then start the local stack. The CLI needs Node.js 20 or later, and the local stack needs Docker or another container runtime.',
    fence('bash', LOCAL_COMMANDS),
    '## Create a hosted project',
    'Create a hosted project in the [Supabase Dashboard](https://supabase.com/dashboard/new), then connect your app.',
    // builds without framework quickstarts have no groups, so this section does not show
    ...(FRAMEWORK_GROUPS.length > 0
      ? [
          '## Connect your app',
          'Install the client library, then follow the quickstart for your framework.',
          // popular repeats frameworks from the other groups
          ...FRAMEWORK_GROUPS.filter((group) => group.id !== 'popular').flatMap((group) => [
            `### ${group.label}`,
            group.frameworks
              .map(
                (framework) =>
                  `- **[${framework.name}](${toUrl(framework.href)})**${framework.install ? `: \`${framework.install}\`` : ''}`
              )
              .join('\n'),
          ]),
        ]
      : []),
    '## Next steps',
    NEXT_STEPS.map(
      (step) => `- **[${step.title}](${toUrl(step.href)}):** ${step.description}`
    ).join('\n'),
    '### Add features',
    EXPLORE_ITEMS.map(
      (item) => `- **[${item.name}](${toUrl(item.href)}):** ${item.description}`
    ).join('\n'),
    '### Full app tutorials',
    FRAMEWORKS.flatMap((framework) => {
      const tutorial = getTutorialStep(framework.slug)
      return tutorial ? [`- [${tutorial.title}](${toUrl(tutorial.href)})`] : []
    }).join('\n'),
  ].join('\n\n')
}
