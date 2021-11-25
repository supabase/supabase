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
              <Typography.Text type="secondary" className="mx-2 ">
                <IconChevronRight size="small" />
              </Typography.Text>
              <Typography.Text>
                <a
                  onClick={breadcrumb.onClick || (() => {})}
                  className={`block px-2 py-1 text-sm leading-5 text-gray-400 focus:outline-none focus:bg-gray-100 focus:text-gray-900 ${
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
