const escapeAttributeSelector = (str: string) => encodeURIComponent(str)

export { escapeAttributeSelector }
export { generateCommandClassNames } from '../internal/Command'
export { toSectionId_ as toSectionId } from '../internal/CommandSection'
export { PageType } from '../internal/state/pagesState'
