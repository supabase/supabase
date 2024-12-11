import { useParams } from 'common'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { Pointer } from 'lucide-react'
import { useRef } from 'react'
import { InnerSideBarEmptyPanel } from 'ui-patterns/InnerSideMenu'
import EntityListItem from './EntityListItem'

export const TableMenuEmptyState = () => {
  const { ref = '' } = useParams()
  const dummyListRef = useRef(null) // statisfy type requirements

  return (
    <InnerSideBarEmptyPanel
      title="No tables or views"
      description="Any tables or views you create will be listed here."
      className="mx-4"
    >
      <div className="top-0 left-6 flex flex-col opacity-50 cursor-not-allowed bg-dash-sidebar h-content -mb-7 pointer-events-none scale-75">
        <div className="relative h-content">
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent from-80% to-100% to-background-surface-100 dark:to-background-surface-75" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent from-50% to-100% to-background-surface-100 dark:to-background-surface-75" />
          </div>
          <div className="absolute left-[150px] bottom-[21px] text-foreground-muted z-10 pointer-events-none">
            <Pointer size={16} className="text-foreground-light" strokeWidth={1.5} />
          </div>
          {[...Array(4)].map((_, i) => (
            <div className="border-l pointer-events-none">
              <EntityListItem
                id={-(i + 1)}
                listRef={dummyListRef}
                index={i} // Add this
                projectRef={ref}
                isLocked={false}
                isActive={i === 2 ? true : false}
                key={-(i + 1)}
                item={{
                  rls_enabled: false,
                  id: -(i + 1),
                  name: `example_table_${i + 1}`,
                  type: i % 2 === 0 ? ENTITY_TYPE.TABLE : ENTITY_TYPE.VIEW,
                  comment: null,
                  schema: 'public',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </InnerSideBarEmptyPanel>
  )
}
