import { Tabs, Alert } from 'ui'
// import Tabs from '@theme/Tabs'
// import TabItem from '@theme/TabItem'

import CodeBlock from './CodeBlock/CodeBlock'

const components = {
  Alert,
  Tabs,
  TabPanel: (props: any) => <Tabs.Panel {...props}>{props.children}</Tabs.Panel>,
  code: (props: any) => <CodeBlock {...props} />,
}

export default components
