/**
 * Custom events are an escape hatch for tying components together when we
 * want to avoid widespread rendering from state updates. Because custom events
 * are stringly typed, the purpose of this utility is to make sure custom event
 * names are globally unique.
 */
enum DocsEvent {
  SIDEBAR_NAV_CHANGE = 'supabase-docs-sidebar-nav-change',
}

const fireCustomEvent = (elem: EventTarget, event: DocsEvent, options?: CustomEventInit) => {
  return elem.dispatchEvent(new CustomEvent(event, options))
}

export { DocsEvent, fireCustomEvent }
