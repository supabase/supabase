import {
  Prompt,
  PromptContent,
  PromptCopy,
  PromptMarkdown,
  PromptPanel,
  PromptTitle,
} from 'ui-patterns/PromptPanel'

import { useTrack } from '@/lib/telemetry/track'

// Speaks in advisors, not issues: that's what the MCP server calls them today
const REVIEW_STEPS = [
  'If the Supabase plugin is not installed or connected, follow https://supabase.com/docs/guides/ai-tools/plugins to set it up for this project.',
  'Retrieve the project’s security, performance and health advisors. Prioritize errors, then warnings, then info.',
  'For each finding, investigate the current state, implement an appropriate fix, and verify it by rerunning the advisor. Ask before making a change that could lose data or remove access someone relies on.',
  'Summarize what changed and how it was verified. List any findings left unresolved and explain why.',
  'If the MCP server does not expose one of these categories, say which one is unavailable rather than assuming it has no findings.',
]

export const IssueAgentPrompt = ({ projectRef }: { projectRef: string }) => {
  const track = useTrack()
  const introduction = `Use the Supabase plugin and its MCP server to review and fix the advisor findings in my project "${projectRef}".`
  const prompt = [
    introduction,
    '',
    ...REVIEW_STEPS.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n')

  return (
    <PromptPanel onCopied={() => track('ai_prompt_copied', { source: 'issues_overview' })}>
      <Prompt value="issues" expandable>
        <PromptTitle>Agent prompt</PromptTitle>
        <PromptCopy>{prompt}</PromptCopy>
        <PromptContent>
          <PromptMarkdown>{prompt}</PromptMarkdown>
        </PromptContent>
      </Prompt>
    </PromptPanel>
  )
}
