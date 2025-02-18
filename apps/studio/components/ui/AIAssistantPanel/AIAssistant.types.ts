export type SupportedAssistantEntities = 'rls-policies' | 'functions'
export type SupportedAssistantQuickPromptTypes = 'suggest' | 'examples' | 'ask'

export interface AssistantSnippetProps {
  title?: string
  isChart?: string
  runQuery?: string
  logs?: string
  xAxis?: string
  yAxis?: string
  name?: string
}
