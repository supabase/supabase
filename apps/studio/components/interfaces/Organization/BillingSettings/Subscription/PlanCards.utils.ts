export const getLiftedSide = ({
  index,
  liftedIndex,
}: {
  index: number
  liftedIndex: number
}): 'left' | 'right' | undefined => {
  // findIndex gives -1 when no card is lifted, so index 0 must not count as its neighbor
  if (liftedIndex === -1) return undefined
  if (index === liftedIndex - 1) return 'right'
  if (index === liftedIndex + 1) return 'left'
  return undefined
}
