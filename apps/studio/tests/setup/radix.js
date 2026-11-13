/**
 * Required setup adapted from https://github.com/radix-ui/primitives/issues/856#issuecomment-928704064
 *
 * ResizeObserver and DomRect are both not available in JSdom (see https://github.com/radix-ui/primitives/issues/856)
 *
 * Effects of this setup file:
 * - sets ResizeObserver to window
 * - sets DOMRect to window
 *
 * Needed to interact with dropdown components, with the `clickDropdown` helper.
 */

// Pure-logic tests run in the node environment, which has no `window` to patch.
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = function () {}

  // // https://github.com/radix-ui/primitives/issues/420#issuecomment-771615182
  window.ResizeObserver = class ResizeObserver {
    constructor(cb) {
      this.cb = cb
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
