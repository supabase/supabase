import * as TabsPrimitive from '@radix-ui/react-tabs'
import { useRouter } from 'next/router'
import * as React from 'react'
import styleHandler from '../../lib/theme/styleHandler'
import { useTabGroup } from './TabsProvider'

interface TabsProps {
  type?: 'pills' | 'underlined' | 'cards' | 'rounded-pills'
  defaultActiveId?: string
  activeId?: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  block?: boolean
  tabBarGutter?: number
  tabBarStyle?: React.CSSProperties
  onChange?: any
  onClick?: any
  scrollable?: boolean
  addOnBefore?: React.ReactNode
  addOnAfter?: React.ReactNode
  listClassNames?: string
  className?: string
  children: PanelPropsProps[]
}

interface TabsSubComponents {
  Panel: React.FC<PanelProps>
}

const Tabs: React.FC<TabsProps> & TabsSubComponents = ({
  defaultActiveId,
  activeId,
  type = 'pills',
  size = 'tiny',
  block,
  onChange,
  onClick,
  scrollable,
  addOnBefore,
  addOnAfter,
  listClassNames,
  className,
  children: _children,
}) => {
  // toArray is used here to filter out invalid children
  // another method would be to use React.Children.map
  const children = React.Children.toArray(_children) as PanelPropsProps[]

  const [activeTab, setActiveTab] = React.useState(
    defaultActiveId ??
      // if no defaultActiveId is set use the first panel
      children?.[0]?.props?.id
  )

  const router = useRouter()
  const hash = router?.asPath?.split('#')[1]?.toUpperCase()

  let __styles = styleHandler('tabs')

  const tabIds = children.map((tab) => tab.props.id)

  const { groupActiveId, setGroupActiveId } = useTabGroup(tabIds)

  const active = activeId ?? groupActiveId ?? activeTab ?? hash

  function onTabClick(id: string) {
    setActiveTab(id)
    setGroupActiveId?.(id)

    onClick?.(id)
    if (id !== active) {
      onChange?.(id)
    }
  }

  const listClasses = [__styles[type].list]
  if (scrollable) listClasses.push(__styles.scrollable)
  if (listClassNames) listClasses.push(listClassNames)

  return (
    <TabsPrimitive.Root value={active} className={`${__styles.base} ${className}`}>
      <TabsPrimitive.List className={listClasses.join(' ')}>
        {addOnBefore}
        {children.map((tab) => {
          const isActive = active === tab.props.id

          const triggerClasses = [__styles[type].base, __styles.size[size]]
          if (isActive) {
            triggerClasses.push(__styles[type].active)
          } else {
            triggerClasses.push(__styles[type].inactive)
          }
          if (block) {
            triggerClasses.push(__styles.block)
          }

          return (
            <TabsPrimitive.Trigger
              onKeyDown={(e: any) => {
                if (e.keyCode === 13) {
                  e.preventDefault()
                  onTabClick(tab.props.id)
                }
              }}
              onClick={() => onTabClick(tab.props.id)}
              key={`${tab.props.id}-tab-button`}
              value={tab.props.id}
              className={triggerClasses.join(' ')}
            >
              {tab.props.icon}
              <span>{tab.props.label}</span>
            </TabsPrimitive.Trigger>
          )
        })}
        {addOnAfter}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  )
}

// bit of a hack because we map over the JSX in the parent component
interface PanelPropsProps {
  props: PanelProps
}

interface PanelProps {
  id: string
  label?: string
  icon?: React.ReactNode
  className?: string
}

export const Panel: React.FC<PanelProps> = ({ children, id, className }) => {
  let __styles = styleHandler('tabs')

  return (
    <TabsPrimitive.Content value={id} className={[__styles.content, className].join(' ')}>
      {children}
    </TabsPrimitive.Content>
  )
}

Tabs.Panel = Panel
export default Tabs
