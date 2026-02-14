import { transformCodeTabs } from './simple-transform'

export function preprocessMdxWithCodeTabs(mdx: string) {
  try {
    // Use simple string-based transformation
    const transformed = transformCodeTabs(mdx)
    return Promise.resolve(transformed)
  } catch (error) {
    console.error('preprocessMdxWithCodeTabs error:', error)
    // Fallback to returning the original MDX
    return Promise.resolve(mdx)
  }
}
