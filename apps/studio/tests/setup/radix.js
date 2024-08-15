/**
 * Required setup adapted from https://github.com/radix-ui/primitives/issues/856#issuecomment-928704064
 *
 * Implements a custom PointerEvent that can then be used to trigger the radix dropdown.
 * This is required as JSdom has not implemented the PointerEvent (see https://github.com/testing-library/react-testing-library/issues/838#issuecomment-735259406)
 *
 * Furthermore, ResizeObserver and DomRect are both not available in JSdom (see https://github.com/radix-ui/primitives/issues/856)
 *
 * Effects of this setup file:
 * - sets PointerEvent to window
 * - sets ResizeObserver to window
 * - sets DOMRect to window
 *
 * Needed to interact with dropdown components, with the `clickDropdown` helper.
 */

class PointerEvent extends Event {
  constructor(type, props) {
    super(type, props)
    if (props.button != null) {
      this.button = props.button
    }
    if (props.ctrlKey != null) {
      this.ctrlKey = props.ctrlKey
    }
  }
}

window.PointerEvent = PointerEvent
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

window.DOMRect = {
  fromRect: () => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
  }),
}
