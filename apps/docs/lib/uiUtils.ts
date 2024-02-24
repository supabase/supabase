const elementInViewport = (elem: Element) => {
  const { top, bottom, left, right } = elem.getBoundingClientRect()
  const { innerHeight, innerWidth } = window

  const topVisible = top > 0 && top < innerHeight
  const bottomVisible = bottom > 0 && bottom < innerHeight
  const leftVisible = left > 0 && left < innerWidth
  const rightVisible = right > 0 && right < innerWidth

  return (topVisible || bottomVisible) && (leftVisible || rightVisible)
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export { elementInViewport, prefersReducedMotion }
