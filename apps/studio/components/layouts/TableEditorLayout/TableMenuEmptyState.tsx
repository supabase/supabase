import { useParams } from 'common'
import { Pointer } from 'lucide-react'
import { useRef } from 'react'
import { InnerSideBarEmptyPanel } from 'ui-patterns/InnerSideMenu'
import { cn, TreeViewItemVariant } from 'ui'
import { EntityTypeIcon } from 'components/ui/EntityTypeIcon'

export const TableMenuEmptyState = () => {
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
            <div className="border-l pointer-events-none" key={`some-${i}`}>
              <div
                className={cn(
                  'group',
                  TreeViewItemVariant({
                    isSelected: i === 2 ? true : false,
                    isOpened: i === 2 ? true : false,
                    isPreview: false,
                  }),
                  'px-4 min-w-40'
                )}
                aria-selected={i === 2}
              >
                {i === 2 && <div className="absolute left-0 h-full w-0.5 bg-foreground" />}
                <EntityTypeIcon type={'r'} />
                {`postgres_table_${i}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </InnerSideBarEmptyPanel>
  )
}
