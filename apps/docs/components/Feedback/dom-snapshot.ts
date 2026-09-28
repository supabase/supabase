import {
  isMeaningfulElement,
  type ElementAttributes,
  type ElementRegion,
  type ElementSnapshot,
} from './element-descriptor.utils'

export const PICKING_ATTRIBUTE = 'data-feedback-picking'

const REGION_SELECTOR = '[data-feedback-region], article'

const REDACT_SELECTOR = '[data-feedback-redact]'

const CLIMB_BOUNDARY_SELECTOR = '[data-feedback-region], article, main, body, html'

const HEADING_SELECTOR = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'

const TEXT_BLOCK_SELECTOR = 'p, li, blockquote, figure, dd, dt'

const VALUE_BEARING_SELECTOR =
  'input, textarea, select, option, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="listbox"], [role="option"], [role="textbox"], [role="searchbox"]'

const SNAPSHOT_ATTRIBUTES = [
  'aria-label',
  'role',
  'title',
  'alt',
  'id',
  'type',
  'contenteditable',
] as const

const MAX_CLIMB_DEPTH = 8

const MAX_HEADING_SEARCH_STEPS = 500

const MAX_RAW_TEXT_LENGTH = 1000

export const getMeaningfulTarget = (element: Element): Element => {
  const codeBlock = element.closest('pre')
  if (codeBlock) return codeBlock

  return (
    getClimbChain(element).find(
      (node) => node.matches(TEXT_BLOCK_SELECTOR) || isMeaningfulElement(readTagAndAttributes(node))
    ) ?? element
  )
}

export const snapshotElement = ({
  element,
  pathname,
}: {
  element: Element
  pathname: string
}): ElementSnapshot => {
  const regionRoot = element.closest(REGION_SELECTOR)
  const region = getRegion(regionRoot)
  const { tag, attributes } = readTagAndAttributes(element)
  const heading =
    region === 'other' ? null : findPrecedingHeading({ element, boundary: regionRoot })

  return {
    tag,
    attributes,
    text: element.matches(VALUE_BEARING_SELECTOR) ? '' : getText(element),
    labelledByText: getLabelledByText(element),
    labelText: getLabelText(element),
    region,
    isRedacted:
      element.closest(REDACT_SELECTOR) !== null || element.querySelector(REDACT_SELECTOR) !== null,
    headingId: heading?.id ?? null,
    headingText: heading ? getHeadingText(heading) : null,
    pathname,
  }
}

const getClimbChain = (element: Element): Element[] => {
  const chain: Element[] = []
  let node: Element | null = element
  while (node && chain.length < MAX_CLIMB_DEPTH && !node.matches(CLIMB_BOUNDARY_SELECTOR)) {
    chain.push(node)
    node = node.parentElement
  }
  return chain
}

const readTagAndAttributes = (
  element: Element
): { tag: string; attributes: ElementAttributes } => ({
  tag: element.tagName.toLowerCase(),
  attributes: Object.fromEntries(
    SNAPSHOT_ATTRIBUTES.flatMap((name) => {
      const value = element.getAttribute(name)
      return value === null ? [] : [[name, value]]
    })
  ),
})

const getRegion = (root: Element | null): ElementRegion => {
  if (!root) return 'other'
  const value = root.getAttribute('data-feedback-region')
  if (value === 'content' || value === 'nav' || value === 'rail') return value
  return root.tagName === 'ARTICLE' && root.closest('main') ? 'content' : 'other'
}

const findPrecedingHeading = ({
  element,
  boundary,
}: {
  element: Element
  boundary: Element | null
}): Element | null => {
  let node: Element | null = element
  let budget = MAX_HEADING_SEARCH_STEPS

  while (node && node !== boundary && budget > 0) {
    if (node.matches(HEADING_SELECTOR)) return node
    let sibling = node.previousElementSibling
    while (sibling && budget > 0) {
      budget -= 1
      if (sibling.matches(HEADING_SELECTOR)) return sibling
      const nested = sibling.querySelectorAll(HEADING_SELECTOR)
      if (nested.length > 0) return nested[nested.length - 1]
      sibling = sibling.previousElementSibling
    }
    node = node.parentElement
  }
  return null
}

const getHeadingText = (heading: Element): string => getText(heading).replace(/\s*#\s*$/, '')

const getLabelledByText = (element: Element): string | null => {
  const ids = element.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? []
  const text = ids
    .map((id) => document.getElementById(id))
    .filter((label) => label !== null)
    .map((label) => getTextOutsideControls(label))
    .join(' ')
  return text || null
}

const getLabelText = (element: Element): string | null => {
  const labels = 'labels' in element && element.labels instanceof NodeList ? element.labels : null
  const firstLabel = labels?.[0]
  const label = firstLabel instanceof Element ? firstLabel : element.closest('label')
  return label ? getTextOutsideControls(label) : null
}

// skip controls so a wrapped select can't leak option texts like project names
const getTextOutsideControls = (root: Element): string => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const parts: string[] = []
  while (walker.nextNode()) {
    const control = walker.currentNode.parentElement?.closest(VALUE_BEARING_SELECTOR)
    if (control && root.contains(control)) continue
    parts.push(walker.currentNode.textContent ?? '')
  }
  return parts.join('').slice(0, MAX_RAW_TEXT_LENGTH)
}

const getText = (element: Element): string =>
  (element.textContent ?? '').slice(0, MAX_RAW_TEXT_LENGTH)
