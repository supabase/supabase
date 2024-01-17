import Link from 'next/link'
import React from 'react'
import { NavigationTabs, NavigationTabsItem } from 'ui'

type Props = {
  projRef: string
  activeTab: 'secrets' | 'keys'
}

const VaultNavTabs = (props: Props) => {
  return (
    <NavigationTabs className="mb-4">
      <NavigationTabsItem active={props.activeTab === 'secrets'}>
        <Link href={`/project/${props.projRef}/settings/vault/secrets`}>Secrets Management</Link>
      </NavigationTabsItem>
      <NavigationTabsItem active={props.activeTab === 'keys'}>
        <Link href={`/project/${props.projRef}/settings/vault/keys`}>Secrets Management</Link>
      </NavigationTabsItem>
    </NavigationTabs>
  )
}

export default VaultNavTabs
