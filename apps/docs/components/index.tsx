import { Button, Tabs, Alert } from 'ui'

// Common components
import Admonition from './Admonition'
import ButtonCard from './ButtonCard'
import CodeBlock from './CodeBlock/CodeBlock'
import { parseNumericRange } from './CodeBlock/CodeBlock.utils'
import JwtGenerator from './JwtGenerator'

// Page specific components
import Frameworks from './Frameworks'
import AuthProviders from './AuthProviders'
import FunctionsExamples from './FunctionsExamples'
import Extensions from './Extensions'

// Other components
import { Heading } from './CustomHTMLElements'
import QuickstartIntro from './MDX/quickstart_intro.mdx'
import ProjectSetup from './MDX/project_setup.mdx'
import { Mermaid } from 'mdx-mermaid/lib/Mermaid'
import InlineCodeTag from './CustomHTMLElements/InlineCode'
import React from 'react'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { CH } from '@code-hike/mdx/components'
import RefHeaderSection from './reference/RefHeaderSection'

const components = {
  Admonition,
  Button,
  ButtonCard,
  CodeBlock,
  Frameworks,
  AuthProviders,
  FunctionsExamples,
  JwtGenerator,
  QuickstartIntro,
  ProjectSetup,
  Mermaid,
  Extensions,
  Alert: (props: any) => (
    <Alert {...props} className="not-prose">
      {props.children}
    </Alert>
  ),
  Tabs,
  TabPanel: (props: any) => <Tabs.Panel {...props}>{props.children}</Tabs.Panel>,
  h2: (props: any) => (
    <Heading tag="h2" {...props}>
      {props.children}
    </Heading>
  ),
  h3: (props: any) => (
    <Heading tag="h3" {...props}>
      {props.children}
    </Heading>
  ),
  pre: (props: any) => {
    const linesToHighlight = parseNumericRange(props.lines ?? '')
    return <CodeBlock {...props} linesToHighlight={linesToHighlight} />
  },
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
  inlineCode: (props: { children: string }) => <InlineCodeTag {...props} />,
  RefSubLayout,
  CH,
  code: (props: any) => <CodeBlock {...props} />,
  RefHeaderSection: (props: any) => <RefHeaderSection {...props} />,
}

export default components
