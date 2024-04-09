const escapeDoubleQuotes = (str: string) => str.replaceAll('"', '\\"')

export { escapeDoubleQuotes }
export { toSectionId_ as toSectionId } from '../internal/CommandSection'
