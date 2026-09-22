/**
 * Explicit tabIndex for keyboard focus (Safari skips buttons otherwise).
 * - Explicit `tabIndex` prop takes precedence
 * - If disabled, default to -1
 * - Otherwise, default to 0
 */
export function getExplicitTabIndex(
  tabIndex: number | undefined,
  disabled?: boolean | null
): number {
  return tabIndex !== undefined ? tabIndex : disabled ? -1 : 0
}
