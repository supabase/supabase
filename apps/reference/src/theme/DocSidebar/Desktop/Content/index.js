import React from 'react'
import Content from '@theme-original/DocSidebar/Desktop/Content'
import { useLocation } from '@docusaurus/router'
import Link from '@docusaurus/Link'

const baseUrl = `new-docs`
const subNavRoutes = [
  // Add any routes which should have a subnav
  `/${baseUrl}/reference/api`,
  `/${baseUrl}/reference/cli`,
  `/${baseUrl}/reference/auth`,
  `/${baseUrl}/reference/storage`,
  `/${baseUrl}/reference/javascript`,
  `/${baseUrl}/reference/dart`,
]

const requiresSubNav = (pathname, routes) => {
  return routes.some((route) => pathname.indexOf(route) == 0)
}

export default function ContentWrapper(props) {
  const { pathname } = useLocation()

  return (
    <>
      {pathname && requiresSubNav(pathname, subNavRoutes) && (
        <Link to={`/${baseUrl}/reference`} id="custom--main-menu-button">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.3284 11.0001V13.0001L7.50011 13.0001L10.7426 16.2426L9.32842 17.6568L3.67157 12L9.32842 6.34314L10.7426 7.75735L7.49988 11.0001L20.3284 11.0001Z"
              fill="currentColor"
            />
          </svg>
          <span>All Reference Docs</span>
        </Link>
      )}
      <Content {...props} />
    </>
  )
}
