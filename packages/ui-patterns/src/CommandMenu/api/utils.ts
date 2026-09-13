const escapeAttributeSelector = (str: string) => encodeURIComponent(str)

export { escapeAttributeSelector }
export { generateCommandClassNames } from '../internal/CommandMenuItem'
export { orderSectionFirst } from '../internal/state/commandsState'
export { PageType } from '../internal/state/pagesState'
