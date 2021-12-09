import LinkCard from './LinkCard'
import LinkCardsWrapper from './LinkCardsWrapper'
import { Tabs } from '@supabase/ui'
import Sponsor from './Sponsor'
import SponsorsWrapper from './SponsorsWrapper'
import CodeBlock from './CodeBlock/CodeBlock'

const components = {
  LinkCard,
  LinkCardsWrapper,
  SponsorsWrapper,
  Sponsor,
  Tabs: (props: any) => <Tabs {...props} type="underlined" size="small" />,
  TabsPanel: (props: any) => {
    return <Tabs.Panel {...props} />
  },
  code: (props: any) => <CodeBlock {...props} />,
}

export default components
