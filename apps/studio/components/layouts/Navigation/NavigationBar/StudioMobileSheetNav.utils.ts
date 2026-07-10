type OutsideInteractionEvent = {
  target: EventTarget | null
  preventDefault: () => void
}

export function preventFloatingToolbarDismiss(event: OutsideInteractionEvent) {
  const target = event.target
  if (target instanceof Element && target.closest('[data-floating-mobile-toolbar]')) {
    event.preventDefault()
  }
}
