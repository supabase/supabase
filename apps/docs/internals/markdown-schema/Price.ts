export const Price = ({ props }: { props: Record<string, unknown> }): string => {
  return `$${props.price}`
}
