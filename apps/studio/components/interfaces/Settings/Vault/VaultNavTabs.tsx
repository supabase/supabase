import Link from 'next/link'
import React, { PropsWithChildren } from 'react'
import { NavMenu, NavMenuItem } from 'ui'

type Props = {
  projRef: string
  activeTab: 'secrets' | 'keys'
}

const VaultNavTabs = (props: PropsWithChildren<Props>) => {
  return (
    <NavMenu className="mb-4" aria-label="Vault menu">
      <NavMenuItem active={props.activeTab === 'secrets'}>
        <Link href={`/project/${props.projRef}/settings/vault/secrets`}>Secrets Management</Link>
      </NavMenuItem>
      <NavMenuItem active={props.activeTab === 'keys'}>
        <Link href={`/project/${props.projRef}/settings/vault/keys`}>Encryption Keys</Link>
      </NavMenuItem>
    </NavMenu>
  )
}

export default VaultNavTabs
