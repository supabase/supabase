export const Panel = ({
  props,
  children,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  const title = String(props.title ?? '')
  const description = children.replace(/\s+/g, ' ').trim()

  if (title && description) return `${title}: ${description}`

  return title || description
}
