import { Tabs, Alert } from 'ui'

import CodeBlock from './CodeBlock/CodeBlock'
import ButtonCard from './ButtonCard'
import Frameworks from './Frameworks'
import AuthProviders from './AuthProviders'
import { H2, H3, H4 } from './CustomMDX'

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

  h2: H2,
  h3: H3,
  h4: H4,
  code: (props: any) => <CodeBlock {...props} />,
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
}

export default components
