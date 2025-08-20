import customContentRaw from './custom-content.json'

// [Joshen] See if we can de-dupe any of the logic here with enabled-features
// For now just getting something working going first

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
  [key in CustomContentToCamelCase<T[number]>]: (typeof customContentStaticObj)[CustomContent]
} => {
  // [Joshen] Running into some TS errors without the `as` here - must be overlooking something super simple
  return Object.fromEntries(
    contents.map((content) => [contentToCamelCase(content), customContentStaticObj[content]])
  ) as {
    [key in CustomContentToCamelCase<T[number]>]: (typeof customContentStaticObj)[CustomContent]
  }
}

export { customContentStaticObj as CUSTOM_CONTENT_SCHEMA, useCustomContent }
