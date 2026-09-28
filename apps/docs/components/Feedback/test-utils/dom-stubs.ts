let matchesQuery: (query: string) => boolean = () => false
let getElementsAtPoint: (x: number, y: number) => Element[] = () => []
const pointerCaptures = new WeakMap<Element, Set<number>>()

window.matchMedia = (query: string): MediaQueryList => ({
  matches: matchesQuery(query),
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})

document.elementsFromPoint = (x: number, y: number) => getElementsAtPoint(x, y)

Element.prototype.setPointerCapture = function (pointerId: number) {
  const captures = pointerCaptures.get(this) ?? new Set<number>()
  captures.add(pointerId)
  pointerCaptures.set(this, captures)
}

Element.prototype.releasePointerCapture = function (pointerId: number) {
  pointerCaptures.get(this)?.delete(pointerId)
}

Element.prototype.hasPointerCapture = function (pointerId: number) {
  return pointerCaptures.get(this)?.has(pointerId) ?? false
}

// radix popper observes its anchor
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

export const setMatchMedia = (matcher: (query: string) => boolean) => {
  matchesQuery = matcher
}

export const setElementsFromPoint = (resolver: (x: number, y: number) => Element[]) => {
  getElementsAtPoint = resolver
}

export const setElementRect = (
  element: Element,
  { left, top, width, height }: { left: number; top: number; width: number; height: number }
) => {
  element.getBoundingClientRect = () => new DOMRect(left, top, width, height)
}

// jsdom reports 0 for clientWidth and clientHeight
export const setViewport = ({ width, height }: { width: number; height: number }) => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: width,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: height,
  })
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
}

export const resetDomStubs = () => {
  matchesQuery = () => false
  getElementsAtPoint = () => []
}
