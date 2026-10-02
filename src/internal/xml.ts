// biome-ignore lint/suspicious/noControlCharactersInRegex: XML 1.0 excludes these ranges.
const INVALID_XML_CHARACTER = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/

export function hasInvalidXmlCharacters(value: string): boolean {
  return INVALID_XML_CHARACTER.test(value) || !value.isWellFormed()
}
