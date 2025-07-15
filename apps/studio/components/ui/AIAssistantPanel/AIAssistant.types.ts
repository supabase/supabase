export type SupportedAssistantEntities = 'rls-policies' | 'functions'
export type SupportedAssistantQuickPromptTypes = 'suggest' | 'examples' | 'ask'

export interface AssistantSnippetProps {
  id?: string
  title?: string
  isChart?: string
  runQuery?: string
  xAxis?: string
  yAxis?: string
  name?: string
}

export type SqlSnippet = string | { label: string; content: string }
