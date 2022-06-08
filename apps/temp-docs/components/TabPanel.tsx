import { ReactElement } from 'react'
import { Tabs } from '@supabase/ui'
export default function TabPanel(props: {
  id: string | undefined
  label: string | undefined
  children: any
}) {
  console.log({ props })
  return (
    <Tabs.Panel id={props.id} label={props.label}>
      {props.children}
    </Tabs.Panel>
  )
}
