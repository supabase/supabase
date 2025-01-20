export type SupportedAssistantEntities = 'rls-policies' | 'functions'
export type SupportedAssistantQuickPromptTypes = 'suggest' | 'examples' | 'ask'

export type AssistantSnippetProps = {
  title: string
  runQuery: 'true' | 'false'
  isChart?: 'true' | 'false'
  xAxis?: string
  yAxis?: string
}
