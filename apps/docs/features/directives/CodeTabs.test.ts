import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { describe, expect, it } from 'vitest'

import { codeTabsRemark } from './CodeTabs'
import { fromDocsMarkdown } from './utils.server'

describe('CodeTabs', () => {
  it('should wrap code blocks in Tabs and TabPanel', () => {
    const mdx = `
<$CodeTabs>

\`\`\`js name=a.js
console.log('Hello, world!');
\`\`\`

\`\`\`js name=b.js
console.log('Hello, world!');
\`\`\`

</$CodeTabs>
`.trim()
    const mdast = fromDocsMarkdown(mdx)
    const transformed = codeTabsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    expect(output).toEqual(
      `
<Tabs listClassNames="flex-nowrap overflow-x-auto -mb-6">
  <TabPanel id="a.js" label="a.js">
    \`\`\`js name=a.js
    console.log('Hello, world!');
    \`\`\`
  </TabPanel>

  <TabPanel id="b.js" label="b.js">
    \`\`\`js name=b.js
    console.log('Hello, world!');
    \`\`\`
  </TabPanel>
</Tabs>
`.trimStart()
    )
  })

  it('should throw if non-code blocks are present', () => {
    const mdx = `
<$CodeTabs>

\`\`\`js name=a.js
console.log('Hello, world!');
\`\`\`

Ladeeda this is forbidden

\`\`\`js name=b.js
console.log('Hello, world!');
\`\`\`

</$CodeTabs>
`.trim()
    const mdast = fromDocsMarkdown(mdx)
    expect(() => codeTabsRemark()(mdast)).toThrowError()
  })

  it('should add a name to a code block outside of CodeTabs if meta present', () => {
    const mdx = `
\`\`\`js name=a.js
console.log('Hello, world!');
\`\`\`

\`\`\`js
console.log('Hello, world!');
\`\`\`
`.trim()
    const mdast = fromDocsMarkdown(mdx)
    const transformed = codeTabsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    expect(output).toEqual(
      `
<NamedCodeBlock name="a.js">
  \`\`\`js name=a.js
  console.log('Hello, world!');
  \`\`\`
</NamedCodeBlock>

\`\`\`js
console.log('Hello, world!');
\`\`\`
`.trimStart()
    )
  })
})
