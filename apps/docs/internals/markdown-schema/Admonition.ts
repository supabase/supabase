export const Admonition = ({
  props,
  children,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  const type = props.type ? String(props.type) : 'note'
  return `${capitalize(type)}: ${children}`
}

const capitalize = <T extends string>(s: T) =>
  (s[0].toUpperCase() + s.slice(1)) as Capitalize<typeof s>
