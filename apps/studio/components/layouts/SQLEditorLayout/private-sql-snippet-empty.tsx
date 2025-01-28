import { Pointer } from 'lucide-react'
import { TreeViewItem } from 'ui'
import { InnerSideBarEmptyPanel } from 'ui-patterns'

export const EmptyPrivateQueriesPanel = () => (
  <InnerSideBarEmptyPanel
    title="No private queries created yet"
    description="Queries will be automatically saved once you start writing in the editor"
    className="mx-4"
  >
    <div className="top-0 left-6 flex flex-col opacity-50 cursor-not-allowed bg-dash-sidebar h-content -mb-7 pointer-events-none scale-75">
      <div className="relative h-content">
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent from-80% to-100% to-background-surface-100 dark:to-background-surface-75" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent from-50% to-100% to-background-surface-100 dark:to-background-surface-75" />
        </div>
        <div className="absolute left-[128px] bottom-[21px] text-foreground-muted z-10 pointer-events-none">
          <Pointer size={16} className="text-foreground-light" strokeWidth={1.5} />
        </div>
        {[...Array(4)].map((_, i) => (
          <div className="border-l pointer-events-none" key={`dummy-${i + 1}`}>
            <TreeViewItem
              isSelected={i === 2}
              id={`dummy-${i + 1}`}
              name={`dummy_query_${i + 1}`}
              level={1}
              xPadding={16}
            />
          </div>
        ))}
      </div>
    </div>
  </InnerSideBarEmptyPanel>
)
