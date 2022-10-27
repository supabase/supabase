import { Tabs, Alert } from 'ui'
// import Tabs from '@theme/Tabs'
// import TabItem from '@theme/TabItem'

import CodeBlock from './CodeBlock/CodeBlock'
import ButtonCard from './ButtonCard'
import Frameworks from './Frameworks'
import { H3, H4 } from './CustomMDX'

const components = {
  h3: H3,
  h4: H4,
  Alert,
  ButtonCard,
  Frameworks,
  Tabs,
  TabPanel: (props: any) => <Tabs.Panel {...props}>{props.children}</Tabs.Panel>,
  code: (props: any) => <CodeBlock {...props} />,
}

export default components
