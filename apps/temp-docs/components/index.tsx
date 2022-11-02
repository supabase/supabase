import { Tabs, Alert } from 'ui'

import Admonition from './Admonition'
import ButtonCard from './ButtonCard'
import CodeBlock from './CodeBlock/CodeBlock'
import Frameworks from './Frameworks'
import AuthProviders from './AuthProviders'

import { Heading } from './CustomHTMLElements'
import QuickstartIntro from './MDX/quickstart_intro.mdx'
import ProjectSetup from './MDX/project_setup.mdx'

const components = {
  Admonition,
  ButtonCard,
  CodeBlock,
  Frameworks,
  AuthProviders,

  QuickstartIntro,
  ProjectSetup,

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
  h4: (props: any) => (
    <Heading tag="h4" {...props}>
      {props.children}
    </Heading>
  ),
  code: (props: any) => <CodeBlock {...props} />,
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
}

export default components
