import { last } from 'lodash'
import { IconChevronRight, IconHome } from 'ui'

interface DrilldownBreadCrumbsProps {
  breadcrumbs: string[]
  resetBreadcrumbs: () => void
  onSelectBreadcrumb: (breadcrumb: string[]) => void
}

const DrilldownBreadCrumbs = ({
  breadcrumbs = [],
  resetBreadcrumbs,
  onSelectBreadcrumb,
}: DrilldownBreadCrumbsProps) => {
  return (
    <div className="flex items-center space-x-2">
      <IconHome
        size={16}
        strokeWidth={2}
        onClick={() => resetBreadcrumbs()}
        className="cursor-pointer"
      />
      {breadcrumbs.length > 0 &&
        breadcrumbs.map((crumb) => (
          <div className="flex items-center space-x-2" key={crumb}>
            <IconChevronRight size={16} strokeWidth={2} />
            {crumb === last(breadcrumbs) ? (
              <p className="font-mono text-xs">{crumb}</p>
            ) : (
              <p className="font-mono text-xs">
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
