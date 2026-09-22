import {
  getCustomContent,
  type CustomContent as CustomContentKey,
} from '~/lib/custom-content/getCustomContent'
import type { ReactNode } from 'react'

import { resolveSharedDataPath } from './SharedData.utils'

type ValueFor<T extends CustomContentKey> = ReturnType<
  typeof getCustomContent<[T]>
>[keyof ReturnType<typeof getCustomContent<[T]>>]

/**
 * A wrapper component to access values from `custom-content.json` within MDX
 * files. Mirrors the `getCustomContent` helper used in TSX code, and follows
 * the same `data`/path-or-render-function pattern as `SharedData`.
 *
 * @param data - The `custom-content.json` key to read, e.g. `navigation:logo`.
 * @param children - How to access the selected value. If it is a render
 *                   function, it takes the value as a param. If it is a
 *                   string, it takes a path through the value, formatted like
 *                   `a[0].b.c`. If omitted, the value itself is rendered.
 *
 * @example Render a value inline
 * <CustomContent data="metadata:title" />
 *
 * @example Address a nested field with a path
 * <CustomContent data="navigation:logo">light</CustomContent>
 *
 * @example Use a render function for richer output
 * <CustomContent data="navigation:logo">
 *   {(logo) => <img src={logo?.light} />}
 * </CustomContent>
 */
function CustomContent<T extends CustomContentKey>({
  data,
  children,
}: {
  data: T
  children?: ((value: ValueFor<T>) => ReactNode) | string
}) {
  const result = getCustomContent([data])
  const value = Object.values(result)[0] as ValueFor<T>

  if (typeof children === 'function') {
    return children(value)
  }
  if (typeof children === 'string') {
    return resolveSharedDataPath(value, children) as ReactNode
  }

  if (value != null && typeof value === 'object') {
    return JSON.stringify(value) as unknown as ReactNode
  }

  return (value ?? null) as ReactNode
}

export { CustomContent }
