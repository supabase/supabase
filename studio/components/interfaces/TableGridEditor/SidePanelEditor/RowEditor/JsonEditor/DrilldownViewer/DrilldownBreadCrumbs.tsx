import { FC } from 'react'
import { last } from 'lodash'
import { Typography, IconHome, IconChevronRight } from '@supabase/ui'

interface Props {
  breadcrumbs: string[]
  onSelectBreadcrumb: (breadcrumb: string[]) => void
}

const DrilldownBreadCrumbs: FC<Props> = ({ breadcrumbs = [], onSelectBreadcrumb = () => {} }) => {
  return (
    <div className="flex items-center space-x-2">
      <Typography>
        <IconHome size={16} strokeWidth={2} />
      </Typography>
      {breadcrumbs.length > 0 &&
        breadcrumbs.map((crumb) => (
          <div className="flex items-center space-x-2" key={crumb}>
            <IconChevronRight size={16} strokeWidth={2} />
            {crumb === last(breadcrumbs) ? (
              <Typography.Text>{crumb}</Typography.Text>
            ) : (
              <Typography.Text>
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    onSelectBreadcrumb(breadcrumbs.slice(0, breadcrumbs.indexOf(crumb) + 1))
                  }
                >
                  {crumb}
                </div>
              </Typography.Text>
            )}
          </div>
        ))}
    </div>
  )
}

export default DrilldownBreadCrumbs
