import { FC } from 'react'
import { last } from 'lodash'
import { IconHome, IconChevronRight } from '@supabase/ui'

interface Props {
  breadcrumbs: string[]
  onSelectBreadcrumb: (breadcrumb: string[]) => void
}

const DrilldownBreadCrumbs: FC<Props> = ({ breadcrumbs = [], onSelectBreadcrumb = () => {} }) => {
  return (
    <div className="flex items-center space-x-2">
      <IconHome size={16} strokeWidth={2} />
      {breadcrumbs.length > 0 &&
        breadcrumbs.map((crumb) => (
          <div className="flex items-center space-x-2" key={crumb}>
            <IconChevronRight size={16} strokeWidth={2} />
            {crumb === last(breadcrumbs) ? (
              <p className="text-xs font-mono">{crumb}</p>
            ) : (
              <p className="text-xs font-mono">
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    onSelectBreadcrumb(breadcrumbs.slice(0, breadcrumbs.indexOf(crumb) + 1))
                  }
                >
                  {crumb}
                </div>
              </p>
            )}
          </div>
        ))}
    </div>
  )
}

export default DrilldownBreadCrumbs
