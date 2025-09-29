/*
 * [Charis 2025-09-29] This file is a duplicate of studio's useCustomContent.ts
 * for now.
 *
 * We should probably consolidate these two files in the future, but we want to
 * get this change shipped quickly without worrying about smoke testing all the
 * components affected by a refactor.
 */

import type { CustomContentTypes } from './CustomContent.types'
import customContentRaw from './custom-content.json'

const customContentStaticObj = customContentRaw as Omit<typeof customContentRaw, '$schema'>
type CustomContent = keyof typeof customContentStaticObj

type SnakeToCamelCase<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${First}${SnakeToCamelCase<Capitalize<Rest>>}`
  : S

type CustomContentToCamelCase<S extends CustomContent> = S extends `${infer P}:${infer R}`
  ? `${SnakeToCamelCase<P>}${Capitalize<SnakeToCamelCase<R>>}`
  : SnakeToCamelCase<S>

function contentToCamelCase(feature: CustomContent) {
  return feature
    .replace(/:/g, '_')
    .split('_')
    .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('') as CustomContentToCamelCase<typeof feature>
}

const useCustomContent = <T extends CustomContent[]>(
  contents: T
): {
  [key in CustomContentToCamelCase<T[number]>]:
    | CustomContentTypes[CustomContentToCamelCase<T[number]>]
    | null
} => {
  // [Joshen] Running into some TS errors without the `as` here - must be overlooking something super simple
  return Object.fromEntries(
    contents.map((content) => [contentToCamelCase(content), customContentStaticObj[content]])
  ) as {
    [key in CustomContentToCamelCase<T[number]>]:
      | CustomContentTypes[CustomContentToCamelCase<T[number]>]
      | null
  }
}

export { useCustomContent }
