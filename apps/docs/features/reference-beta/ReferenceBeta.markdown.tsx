import { MDXRemoteBase } from '~/features/docs/MdxBase'

/**
 * Markdown from a library's definition files (descriptions, notes). Rendered
 * with the same components as guides, so code blocks and links look the same,
 * but parsed as plain Markdown: libraries don't write MDX, and a stray `{` or
 * `<` in their text must not break the page.
 */
export const ReferenceBetaMarkdown = ({ children }: { children: string }) => (
  <MDXRemoteBase
    source={children}
    options={{ mdxOptions: { format: 'md' } }}
    customPreprocess={(source) => source}
  />
)

/**
 * A library's `index.md`, which is authored in this repo and so can use the
 * same MDX components as guides (`Tabs`, `Admonition`, ...).
 */
export const ReferenceBetaMdx = ({ children }: { children: string }) => (
  <MDXRemoteBase source={children} />
)
