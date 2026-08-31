import { withDocsBasePath } from '../internal-links'

export const Link = ({
  props,
  children,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  const href = withDocsBasePath(String(props.href ?? ''))
  return `[${children}](${href})`
}
