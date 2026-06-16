export const TabPanel = ({
  props,
  children,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  return props.label ? `**${String(props.label)}**\n\n${children}` : children
}
