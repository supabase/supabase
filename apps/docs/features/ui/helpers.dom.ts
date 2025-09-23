export function isElementInViewport(element: HTMLElement) {
  const { top, left, width, height } = element.getBoundingClientRect()
  const { innerWidth, innerHeight } = window

  return (
    ((top >= 0 && top < innerHeight) || (top < 0 && top + height > 0)) &&
    ((left >= 0 && left < innerWidth) || (left < 0 && left + width > 0))
  )
}
