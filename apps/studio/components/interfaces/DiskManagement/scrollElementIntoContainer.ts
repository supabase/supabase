const DEFAULT_OFFSET_PX = 96 // matches scroll-mt-24

/**
 * Scroll `element` to the top of `container` without Element.scrollIntoView.
 * scrollIntoView walks every overflow ancestor (Studio has two nested mains)
 * and, mid layout shift, can inflate a flex item instead of moving scrollTop.
 */
export function scrollElementIntoContainer(
  element: HTMLElement | null | undefined,
  container: HTMLElement | null | undefined,
  {
    behavior = 'smooth',
    offset = DEFAULT_OFFSET_PX,
  }: { behavior?: ScrollBehavior; offset?: number } = {}
) {
  if (!element) return

  if (!container) {
    element.scrollIntoView({ behavior, block: 'start' })
    return
  }

  const top =
    element.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop -
    offset

  container.scrollTo({ top: Math.max(0, top), behavior })
}
