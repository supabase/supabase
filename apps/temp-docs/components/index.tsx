import { Tabs, Alert } from 'ui'

import CodeBlock from './CodeBlock/CodeBlock'
import ButtonCard from './ButtonCard'
import Frameworks from './Frameworks'
import AuthProviders from './AuthProviders'
import { H3, H4 } from './CustomHTMLElements'

import QuickstartIntro from './MDX/quickstart_intro.mdx'
import ProjectSetup from './MDX/project_setup.mdx'

const components = {
  ButtonCard,
  CodeBlock,
  Frameworks,
  AuthProviders,

  QuickstartIntro,
  ProjectSetup,

  Alert,
  Tabs,
  TabPanel: (props: any) => <Tabs.Panel {...props}>{props.children}</Tabs.Panel>,

  h3: H3,
  h4: H4,
  code: (props: any) => <CodeBlock {...props} />,
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
}

export default components
