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

// Other components
import { Heading } from './CustomHTMLElements'
import QuickstartIntro from './MDX/quickstart_intro.mdx'
import ProjectSetup from './MDX/project_setup.mdx'

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
  code: (props: any) => {
    const linesToHighlight = parseNumericRange(props.lines ?? '')
    return <CodeBlock {...props} linesToHighlight={linesToHighlight} />
  },
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
}

export default components
