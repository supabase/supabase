import type { CustomContentTypes } from './CustomContent.types'
import customContentRaw from './custom-content.json'

const customContentStaticObj = customContentRaw as Omit<typeof customContentRaw, '$schema'>
export type CustomContent = keyof typeof customContentStaticObj

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

type CustomContentResult<T extends CustomContent[]> = {
  [key in CustomContentToCamelCase<T[number]> extends keyof CustomContentTypes
    ? CustomContentToCamelCase<T[number]>
    : never]: CustomContentTypes[key] | null
}

export const getCustomContent = <T extends CustomContent[]>(
  contents: T
): CustomContentResult<T> => {
  return Object.fromEntries(
    contents.map((content) => [contentToCamelCase(content), customContentStaticObj[content]])
  ) as CustomContentResult<T>
}
