import {
  Prompt,
  PromptContent,
  PromptCopy,
  PromptMarkdown,
  PromptPanel,
  PromptTitle,
} from 'ui-patterns/PromptPanel'

const REVIEW_STEPS = [
  'If the Supabase plugin is not installed or connected, follow https://supabase.com/docs/guides/ai-tools/plugins to set it up for this project.',
  'Retrieve the project’s open issues. Review their descriptions, affected resources, and recent activity. Prioritize critical issues, then warnings.',
  'Investigate the current state, implement appropriate fixes, and verify the results by rerunning the relevant checks or queries.',
  'Update each issue with what changed and how it was verified. Resolve only issues confirmed fixed. Leave unresolved issues open and explain what remains.',
  'If the MCP server does not expose issue tools, explain what is unavailable rather than assuming there are no issues.',
]

export const IssueAgentPrompt = ({ projectRef }: { projectRef: string }) => {
  const introduction = `Use the Supabase plugin and its MCP server to review and address the open issues in my project "${projectRef}".`
  const prompt = [
    introduction,
    '',
    ...REVIEW_STEPS.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n')

  return (
    <PromptPanel>
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
