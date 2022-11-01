import { Tabs, Alert } from 'ui'

import CodeBlock from './CodeBlock/CodeBlock'
import ButtonCard from './ButtonCard'
import Frameworks from './Frameworks'
import AuthProviders from './AuthProviders'
import { Heading } from './CustomMDX'

const components = {
  Alert: (props: any) => (
    <Alert {...props} className="not-prose">
      {props.children}
    </Alert>
  ),
  ButtonCard,
  CodeBlock,
  Frameworks,
  AuthProviders,

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
