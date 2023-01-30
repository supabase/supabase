import * as React from 'react'
import { TabsContext } from './TabsContext'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { useRouter } from 'next/router'

// @ts-ignore
// import TabsStyles from './Tabs.module.css'

import styleHandler from '../../lib/theme/styleHandler'

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
  children,
}) => {
  const [activeTab, setActiveTab] = React.useState(
    defaultActiveId
      ? defaultActiveId
      : // if no defaultActiveId is set use the first panel
      children && children[0].props
      ? children[0].props.id
      : ''
  )

  const router = useRouter()
  const hash = router?.asPath?.split('#')[1]?.toUpperCase()

  let __styles = styleHandler('tabs')

  // activeId state can be overriden externally with `active`
  // defaults to the first panelif we have one or url hash if not
  const active = activeId ? activeId : activeTab ? activeTab : hash

  function onTabClick(id: string) {
    const newTabSelected = id !== active
    setActiveTab(id)
    if (onClick) onClick(id)
    if (onChange && newTabSelected) onChange(id)
  }

  // for styling the tabs for underline style
  const underlined = type === 'underlined'
  // for styling the tabs for cards style

  const listClasses = [__styles[type].list]
  if (scrollable) listClasses.push(__styles.scrollable)
  if (listClassNames) listClasses.push(listClassNames)

  // if only 1 react child, it needs to be converted to a list/array
  // this is so 1 tab can be displayed
  if (children && !Array.isArray(children)) {
    children = [children]
  }

  return (
    <TabsPrimitive.Root defaultValue={defaultActiveId} value={active} className={__styles.base}>
      <TabsPrimitive.List className={listClasses.join(' ')}>
        {addOnBefore}
        {children.map((tab) => {
          const activeMatch = active === tab.props.id

          const triggerClasses = [__styles[type].base, __styles.size[size]]
          if (activeMatch) {
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
        {/* </Space> */}
        {addOnAfter}
      </TabsPrimitive.List>
      <TabsContext.Provider value={{ activeId: active }}>{children}</TabsContext.Provider>
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
    <TabsContext.Consumer>
      {({ activeId }) => {
        const active = activeId === id
        return (
          <TabsPrimitive.Content value={id} className={[__styles.content, className].join(' ')}>
            {children}
          </TabsPrimitive.Content>
        )
      }}
    </TabsContext.Consumer>
  )
}

Tabs.Panel = Panel
export default Tabs
