export const AccordionItem = ({
  props,
  children,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  const header = String(props.header ?? '').trim()
  return header ? `**${header}**\n\n${children}` : children
}
