import {
  getCustomContent,
  type CustomContent as CustomContentKey,
} from '~/lib/custom-content/getCustomContent'
import { ReactNode } from 'react'

type ValueFor<T extends CustomContentKey> = ReturnType<
  typeof getCustomContent<[T]>
>[keyof ReturnType<typeof getCustomContent<[T]>>]

/**
 * A wrapper component to access values from `custom-content.json` within MDX
 * files. Mirrors the `getCustomContent` helper used in TSX code.
 *
 * @example Render a value inline
 * <CustomContent path="metadata:title" />
 *
 * @example Use a render function for richer output
 * <CustomContent path="navigation:logo">
 *   {(logo) => <img src={logo?.light} />}
 * </CustomContent>
 */
function CustomContent<T extends CustomContentKey>({
  path,
  children,
}: {
  path: T
  children?: (value: ValueFor<T>) => ReactNode
}) {
  const result = getCustomContent([path])
  const value = Object.values(result)[0] as ValueFor<T>

  if (typeof children === 'function') {
    return children(value)
  }

  return (value ?? null) as ReactNode
}

export { CustomContent }
