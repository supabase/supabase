const EDIT_LINK_SYMBOL = Symbol('edit link')

interface EditLink {
  [EDIT_LINK_SYMBOL]: true
  link: string
  includesProtocol: boolean
}

/**
 * Create an object representing a link where the original content can be
 * edited.
 *
 * Takes either a relative path, which will be prefixed with
 * `https://github.com/`, or a full URL including protocol.
 */
const newEditLink = (str: string): EditLink => {
  if (str.startsWith('/')) {
    throw Error(`Edit links cannot start with slashes. Received: ${str}`)
  }

  /**
   * Catch strings that provide FQDNS without https?:
   *
   * At the start of a string, before the first slash, there is a dot
   * surrounded by non-slash characters.
   */
  if (/^[^\/]+\.[^\/]+\//.test(str)) {
    throw Error(`Fully qualified domain names must start with 'https?'. Received: ${str}`)
  }

  return {
    [EDIT_LINK_SYMBOL]: true,
    link: str,
    includesProtocol: str.startsWith('http://') || str.startsWith('https://'),
  }
}

export { newEditLink }
export type { EditLink }
