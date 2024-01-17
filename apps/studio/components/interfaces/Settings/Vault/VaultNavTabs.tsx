import Link from 'next/link'
import React, { PropsWithChildren } from 'react'
import { TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_ } from 'ui'

type Props = {
  projRef: string
  activeTab: 'secrets' | 'keys'
}

const VaultNavTabs = (props: PropsWithChildren<Props>) => {
  return (
    <Tabs_Shadcn_ value={props.activeTab}>
      <TabsList_Shadcn_>
        <TabsTrigger_Shadcn_ value="secrets" asChild>
          <Link href={`/project/${props.projRef}/settings/vault/secrets`}>Secrets Management</Link>
        </TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="keys" asChild>
          <Link href={`/project/${props.projRef}/settings/vault/keys`}>Encryption Keys</Link>
        </TabsTrigger_Shadcn_>
      </TabsList_Shadcn_>
      <TabsContent_Shadcn_ className="mt-4" value={props.activeTab}>
        {props.children}
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}

export default VaultNavTabs
