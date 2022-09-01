import React from 'react'
import Content from '@theme-original/DocSidebar/Desktop/Content'
import { useLocation } from '@docusaurus/router'
import Link from '@docusaurus/Link'

const baseUrl = `docs`
const subNavRoutes = [
  // Add any routes which should have a subnav
  `/${baseUrl}/reference/api`,
  `/${baseUrl}/reference/cli`,
  `/${baseUrl}/reference/auth`,
  `/${baseUrl}/reference/storage`,
  `/${baseUrl}/reference/javascript`,
  `/${baseUrl}/reference/dart`,
]

const headerNames = {
  api: {
    name: 'API',
    icon: 'api-icon',
  },
  cli: {
    name: 'CLI',
    icon: 'cli-icon',
  },
  auth: {
    name: 'Auth',
    icon: 'javascript-icon',
  },
  storage: {
    name: 'Storage',
  },
  javascript: {
    name: 'supabase-js',
    icon: 'javascript-icon',
  },
  dart: {
    name: 'Dart',
    icon: 'dart-icon',
  },
  'auth-helpers': {
    name: 'Auth Helpers',
  },
}

const requiresSubNav = (pathname, routes) => {
  const found = routes.find((route) => pathname.indexOf(route) == 0)
  return found
}

const RefHeader = (props) => {
  const paths = Object.keys(headerNames)
  const split = props.pathname.split('/')[3]
  const found = paths.find((p) => {
    return split === p
  })

  return (
    <div className="custom--main-menu-header-container">
      {headerNames[found].icon && (
        <div className="custom--main-menu-header__icon">
          <img
            src={`/${baseUrl}/img/icons/${headerNames[found].icon}.svg`}
            alt="supabase-logo"
          />
        </div>
      )}
      <h4 className="custom--main-menu-header">{headerNames[found].name}</h4>
    </div>
  )
}

export default function ContentWrapper(props) {
  const { pathname } = useLocation()

  return (
    <>
      <div className="theme-doc-sidebar-menu-custom-container">
        {pathname && requiresSubNav(pathname, subNavRoutes) && (
          <>
            <Link
              to={`/${baseUrl}/reference`}
              className="custom--main-menu-button"
            >
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
            <RefHeader pathname={pathname} />
          </>
        )}
        <Content {...props} />
      </div>
    </>
  )
}
