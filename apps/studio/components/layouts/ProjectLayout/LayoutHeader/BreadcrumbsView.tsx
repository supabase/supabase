import { Fragment } from 'react'

interface BreadcrumbsViewProps {
  defaultValue: any
}

const BreadcrumbsView = ({ defaultValue: breadcrumbs }: BreadcrumbsViewProps) => {
  return (
    <>
      {breadcrumbs?.length
        ? breadcrumbs.map((breadcrumb: any, i: number) => (
            <Fragment key={breadcrumb.key}>
              {i > 0 && (
                <span className="text-border-stronger dark:text-border-strong">
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
              )}

              <a
                onClick={breadcrumb.onClick || (() => {})}
                className={`text-gray-1100 block px-2 py-1 text-xs leading-5 focus:bg-gray-100 focus:text-gray-900 focus:outline-none ${
                  breadcrumb.onClick ? 'cursor-pointer hover:text-white' : ''
                }`}
              >
                {breadcrumb.label}
              </a>
            </Fragment>
          ))
        : null}
    </>
  )
}

export default BreadcrumbsView
