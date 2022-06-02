import { Tabs } from '@supabase/ui'

const TabWrapper = (props: any) => {
  return (
    <div className="dashboard-tabs">
      <Tabs size="xlarge" type="underlined">
        <Tabs.Panel id={props.id} label={props.label}>
          {props.children}
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

export default TabWrapper
