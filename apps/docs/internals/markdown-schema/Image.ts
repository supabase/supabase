import { getInternalLinkBaseUrl, withDocsBasePath } from '../internal-links'

export const Image = ({ props }: { props: Record<string, unknown> }): string => {
  const alt = String(props.alt ?? '')
  const rawSrc = props.src as string

  // propsFrom() always stores attribute values as strings: either the literal
  // string value for `src="/..."`, or the raw JS expression for `src={{ dark, light }}`.
  const srcStr = String(rawSrc ?? '')
  let src = String(props.src)

  if (!srcStr.startsWith('/')) {
    // Object expression form: `src={{ dark: '/...', light: '/...' }}`
    const match =
      srcStr.match(/dark:\s*['"]([^'"]+)['"]/) ?? srcStr.match(/light:\s*['"]([^'"]+)['"]/)
    src = match ? match[1] : ''
  }

  const baseUrl = getInternalLinkBaseUrl()
  return `![${alt}](${baseUrl}${withDocsBasePath(src)})`
}
