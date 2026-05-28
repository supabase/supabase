type Point = { x: number; y: number }

/** Local coordinates inside `container`, unaffected by ancestor 3D transforms. */
export function getLocalPointInContainer(
  container: HTMLElement,
  element: HTMLElement,
  relativeX: number,
  relativeY: number
): Point {
  let x = element.offsetLeft + element.offsetWidth * relativeX
  let y = element.offsetTop + element.offsetHeight * relativeY
  let offsetParent = element.offsetParent as HTMLElement | null

  while (offsetParent && offsetParent !== container && container.contains(offsetParent)) {
    x += offsetParent.offsetLeft
    y += offsetParent.offsetTop
    offsetParent = offsetParent.offsetParent as HTMLElement | null
  }

  if (offsetParent === container) {
    return { x, y }
  }

  x = element.offsetWidth * relativeX
  y = element.offsetHeight * relativeY
  let node: HTMLElement | null = element

  while (node && node !== container) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.parentElement
  }

  return { x, y }
}

export function randomPointInContainer(container: HTMLElement, index: number): Point {
  const width = container.clientWidth
  const height = container.clientHeight

  return {
    x: Math.min(width - 24, 40 + Math.random() * Math.max(width * 0.55, 120) + index * 12),
    y: Math.min(height - 24, 60 + Math.random() * Math.max(height * 0.45, 80)),
  }
}
