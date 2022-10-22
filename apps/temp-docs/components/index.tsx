import { Tabs, Alert } from 'ui'
// import Tabs from '@theme/Tabs'
// import TabItem from '@theme/TabItem'

import CodeBlock from './CodeBlock/CodeBlock'

const components = {
  Alert,
  Tabs,
  // TabItem,
  code: (props: any) => <CodeBlock {...props} />,
}

export default components
