type HandlerContext = {
  children: string
}

const preserveChildren = ({ children }: HandlerContext): string => children

const PromptTitle = ({ children }: HandlerContext): string => {
  const title = children.trim()
  return title ? `**${title}**` : ''
}

// PromptCopy is clipboard-only metadata. PromptContent is the visible source of
// truth and is preserved below, so including both would duplicate the prompt.
const PromptCopy = (_context: HandlerContext): string => ''

export const PromptPanel = {
  PromptPanel: preserveChildren,
  Prompt: preserveChildren,
  PromptTitle,
  PromptCopy,
  PromptContent: preserveChildren,
}
