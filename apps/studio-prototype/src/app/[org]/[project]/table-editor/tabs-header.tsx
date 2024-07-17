'use client'

import { useConfig } from '@/src/hooks/use-config'
import { PanelLeftClose, PanelLeftOpen, PlusCircle, Table2, X } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { SQL_ICON, ScrollArea, ScrollBar, cn } from 'ui'

export default function TabsHeader() {
  const [config, setConfig] = useConfig()
  const { id: pageId } = useParams()

  // table tabs and sql tabs
  const tabs = [
    {
      name: 'customers',
      label: 'Customers',
      type: 'table',
    },
    {
      name: 'orders',
      label: 'Orders',
      type: 'sql',
    },
    {
      name: 'products',
      label: 'Products',
      type: 'table',
    },
    {
      name: 'monthly_sales_report',
      label: 'Monthly Sales Report',
      type: 'sql',
    },
    {
      name: 'inventory_status',
      label: 'Inventory Status',
      type: 'sql',
    },
    // {
    //   name: 'employees',
    //   label: 'Employees',
    //   type: 'table',
    // },
    // {
    //   name: 'suppliers',
    //   label: 'Suppliers',
    //   type: 'table',
    // },
    // {
    //   name: 'sales_analytics',
    //   label: 'Sales Analytics',
    //   type: 'sql',
    // },
  ]

  return (
    <div className="w-full bg-dash-canvas h-[38px] border-b flex gap-0 z-10">
      <div className="h-full bg-dash-sidebar items-center flex px-3">
        {config.tableEditor.sidePanelOpen ? (
          <PanelLeftClose
            size={16}
            strokeWidth={1.5}
            className={cn(
              'text-foreground-muted hover:text-foreground-light transition-colors cursor-pointer'
            )}
            onClick={() =>
              setConfig({
                ...config,
                tableEditor: {
                  ...config.tableEditor,
                  sidePanelOpen: false,
                },
              })
            }
          />
        ) : (
          <PanelLeftOpen
            size={16}
            strokeWidth={1.5}
            className={cn(
              'text-foreground-muted hover:text-foreground-light transition-colors cursor-pointer'
            )}
            onClick={() =>
              setConfig({
                ...config,
                tableEditor: {
                  ...config.tableEditor,
                  sidePanelOpen: true,
                },
              })
            }
          />
        )}
      </div>
      {/* <ScrollArea dir="ltr" className="w-full flex">
        <ScrollBar orientation="horizontal"> */}
      {tabs.map((tab, i) => (
        <Tab
          key={tab.name}
          label={tab.label}
          type={tab.type}
          id={i + 1}
          active={Number(pageId) === i + 1}
        />
      ))}
      {/* </ScrollBar>
      </ScrollArea> */}
    </div>
  )
}

const HandleIcon = ({ type, active }: { type: string; active: boolean }) => {
  switch (type) {
    case 'table':
      return (
        <Table2
          className={cn(
            'transition-colors',
            'text-foreground-muted',
            'group-aria-[current=true]:text-foreground-light',
            'w-4 h-4',
            'transition-all'
          )}
          size={14}
          strokeWidth={1.5}
        />
      )
      break

    case 'sql':
      return (
        <SQL_ICON
          className={cn(
            'transition-colors',
            'fill-foreground-muted',
            'group-aria-[current=true]:fill-foreground-light',
            'w-4 h-4',
            '-mt-1',
            'transition-all'
          )}
          size={14}
          strokeWidth={1.5}
        />
      )
      return

    default:
      break
  }
}

const Tab = ({
  label,
  type,
  active,
  id,
}: {
  label: string
  type: string
  active: boolean
  id: number
}) => {
  const router = useRouter()
  const [config] = useConfig()

  return (
    <button
      key={id}
      className={cn(
        'group',
        active
          ? 'gap-2 bg-surface-100 h-[40px] top-0 text-foreground'
          : 'gap-1 bg-surface-200 dark:bg-surface-200/50 h-full text-foreground-lighter hover:bg-dash-sidebar dark:hover:bg-surface-100',
        'first-of-type:border-l border-r text-sm flex items-center px-3 min-w-[96px] max-w-[196px]',
        'text-xs',
        'transition-all'
      )}
      aria-current={active}
      onClick={() =>
        router.push(`/${config.selectedOrg?.key}/${config.selectedProject?.key}/table-editor/${id}`)
      }
    >
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 flex items-center justify-center">
          <HandleIcon type={type} active={active} />
        </div>
        <span className="grow truncate">{label}</span>
      </div>
      <div className="w-4 h-4 flex items-center justify-center">
        <X
          className={cn(
            'transition-colors',
            'opacity-0',
            'text-foreground-muted',
            'group-hover:opacity-100',
            'group-aria-[current=true]:opacity-100',
            'group-aria-[current=true]:text-lighter',
            'hover:text-foreground-light',
            'w-4 h-4',
            '-ml-0.5'
          )}
          size={14}
          strokeWidth={1.5}
        />
      </div>
    </button>
  )
}
