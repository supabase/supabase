const elementInViewport = (elem: Element) => {
  console.log(elem)
  const { top, bottom, left, right } = elem.getBoundingClientRect()
  const { innerHeight, innerWidth } = window

  const topVisible = top > 0 && top < innerHeight
  const bottomVisible = bottom > 0 && bottom < innerHeight
  const leftVisible = left > 0 && left < innerWidth
  const rightVisible = right > 0 && right < innerWidth
  console.log(topVisible, bottomVisible, leftVisible, rightVisible)

  return (topVisible || bottomVisible) && (leftVisible || rightVisible)
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const scrollParentOrigin = (elem: Element | null | undefined) => {
  if (!elem) return

  const getScrollParent = (node: Element) => {
    const parent = node.parentElement
    if (!parent) return null

    if (parent.scrollHeight > parent.clientHeight) {
      return parent
    } else {
      return getScrollParent(parent)
    }
  }

  const scrollParent = getScrollParent(elem)
  if (scrollParent) scrollParent.scrollTo(0, 0)
}

export { elementInViewport, prefersReducedMotion, scrollParentOrigin }
