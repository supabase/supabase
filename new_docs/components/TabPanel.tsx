import { ReactElement } from 'react'
import { Tabs } from '@supabase/ui'
export default function TabPanel(props) {
  console.log({ props })
  return (
    <Tabs.Panel id={props.id} label={props.label}>
      {props.children}
    </Tabs.Panel>
  )
}
