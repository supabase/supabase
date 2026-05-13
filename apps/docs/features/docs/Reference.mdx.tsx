import CliGlobalFlagsHandler from '~/components/reference/enrichments/cli/CliGlobalFlagsHandler'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { components } from '~/features/docs/MdxBase.shared'
import { RefSubLayout } from '~/features/docs/Reference.ui'
import { type ComponentProps } from 'react'

import { CodeBlock } from '../ui/CodeBlock/CodeBlock'
import { getRefMarkdown } from './Reference.mdx.fetch'

interface MDXRemoteRefsProps {
  source: string
}

function MDXRemoteRefs({ source }: MDXRemoteRefsProps) {
  const refComponents = {
    ...components,
    // Override the CodeBlock used for normal guides to skip type generation
    // because it is too resource-intensive
    pre: (props: ComponentProps<typeof CodeBlock>) => <CodeBlock {...props} skipTypeGeneration />,
    RefSubLayout,
    CliGlobalFlagsHandler,
  }

  return <MDXRemoteBase source={source} components={refComponents} />
}

export { getRefMarkdown, MDXRemoteRefs }
