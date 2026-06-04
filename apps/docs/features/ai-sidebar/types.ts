export interface CodeContext {
  language: string
  content: string
  lineCount: number
  pageUrl: string
  pagePath: string
  sectionHeadingId?: string | null
}

export const DOCS_AI_SIDEBAR_WIDTH_DEFAULT_PX = 480
export const DOCS_AI_SIDEBAR_WIDTH_XL_PX = 580
export const DOCS_AI_SIDEBAR_WIDTH_MIN_PX = 400
export const DOCS_AI_SIDEBAR_WIDTH_MAX_PX = 720
export const DOCS_AI_SIDEBAR_WIDTH_STORAGE_KEY = 'docs-ai-sidebar-width'

export function getDefaultSidebarWidth(viewportWidth: number) {
  return viewportWidth >= 1280
    ? DOCS_AI_SIDEBAR_WIDTH_XL_PX
    : DOCS_AI_SIDEBAR_WIDTH_DEFAULT_PX
}

/** @deprecated Use dynamic sidebar width from DocsAiSidebarProvider */
export const DOCS_AI_SIDEBAR_WIDTH_PX = DOCS_AI_SIDEBAR_WIDTH_DEFAULT_PX
