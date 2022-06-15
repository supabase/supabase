import { Tabs } from '@supabase/ui'
export default function TabPanel(props: { id: string; label: string | undefined; children: any }) {
  return (
    <Tabs.Panel id={props.id} label={props.label}>
      {props.children}
    </Tabs.Panel>
  )
}
