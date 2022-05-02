import { Tabs } from '@supabase/ui'

const TabWrapper = (props) => {
  console.log('Tab props: ', props)
  const { children, ...otherProps } = props

  return <Tabs {...otherProps}>{props.children}</Tabs>
}

export default TabWrapper
