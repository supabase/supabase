import { useState } from 'react'

interface MobileMenuHook {
  /** Current state of the mobile menu */
  isOpen: boolean
  /** Function to open the mobile menu */
  open: () => void
  /** Function to close the mobile menu */
  close: () => void
  /** Function to toggle the mobile menu state */
  toggle: () => void
}

/**
 * A custom hook for managing mobile menu state in the application.
 * This hook provides a simple interface for controlling the mobile navigation menu,
 * commonly used in responsive layouts where the navigation collapses into a mobile menu.
 *
 * @returns An object containing the mobile menu state and control functions
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useMobileMenu()
 *
 * // Open menu
 * open()
 *
 * // Close menu
 * close()
 *
 * // Toggle menu
 * toggle()
 * ```
 */
export function useMobileMenu(): MobileMenuHook {
  const [isOpen, setIsOpen] = useState(false)

  /**
   * Opens the mobile menu by setting isOpen to true
   */
  const open = () => setIsOpen(true)

  /**
   * Closes the mobile menu by setting isOpen to false
   */
  const close = () => setIsOpen(false)

  /**
   * Toggles the mobile menu state between open and closed
   * @returns {void}
   */
  const toggle = () => setIsOpen((prev) => !prev)

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
