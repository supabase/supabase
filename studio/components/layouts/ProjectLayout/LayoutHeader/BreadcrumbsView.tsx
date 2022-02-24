import { FC, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { Typography, IconChevronRight } from '@supabase/ui'

interface Props {
  defaultValue: any
}

const BreadcrumbsView: FC<Props> = ({ defaultValue: breadcrumbs }) => {
  return (
    <>
      {breadcrumbs?.length
        ? breadcrumbs.map((breadcrumb: any) => (
            <Fragment key={breadcrumb.key}>
              <span className="text-scale-800 dark:text-scale-700">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  shapeRendering="geometricPrecision"
                >
                  <path d="M16 3.549L7.12 20.600"></path>
                </svg>
              </span>
              <Typography.Text>
                <a
                  onClick={breadcrumb.onClick || (() => {})}
                  className={`block px-2 py-1 text-xs leading-5 text-gray-1100 focus:outline-none focus:bg-gray-100 focus:text-gray-900 ${
                    breadcrumb.onClick ? 'cursor-pointer hover:text-white' : ''
                  }`}
                >
                  {breadcrumb.label}
                </a>
              </Typography.Text>
            </Fragment>
          ))
        : null}
    </>
  )
}

export default observer(BreadcrumbsView)
