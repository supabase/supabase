import '~/styles/style.scss'
import '~/styles/prism-tomorrow.scss'
import Navbar       from '../Navbar'
import NavbarDocs   from '../NavbarDocs'
import Footer       from '../Footer'
import Head         from 'next/head'
import Link         from 'next/link'
import { useRouter }                    from 'next/router'
import React, { useState, useEffect }   from 'react'

export default function DocsLayout(props) {
  const [sidebarVisible, toggleSidebar] = useState(false)
  const { sidebar } = props
  return (
    <>
      <Head>
        <title>Supabase | Docs</title>
      </Head>
      <div className="">
        <Navbar isFullwidth={true} />
        <NavbarDocs />
        <div className="columns m-none is-gapless">
          <div
            className="DocsMenuColumn docs-subnav column is-narrow is-hidden-mobile"
            style={{ width: 250 }}
          >
            {Sidebar(sidebar, () => toggleSidebar(false))}
          </div>
          <div className="column">{props.children}</div>
        </div>
        <Footer isFullwidth={true} />

        <nav
          className="navbar is-fixed-bottom has-background-dark is-hidden-tablet"
          role="navigation"
          aria-label="sub navigation"
        >
          <a className="navbar-brand" onClick={() => toggleSidebar(!sidebarVisible)}>
            <div className="navbar-item">
              <h5 className="title is-5">Menu</h5>
            </div>

            <span
              role="button"
              className={sidebarVisible ? 'navbar-burger is-active' : 'navbar-burger'}
              aria-label="menu"
              aria-expanded="false"
            >
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </span>
          </a>

          <div className={sidebarVisible ? 'navbar-menu is-active' : 'navbar-menu'}>
            <div className="navbar-end docs-subnav">
              {Sidebar(sidebar, () => toggleSidebar(false))}
              <div className="p-md">
                <a className="button is-fullwidth" onClick={() => toggleSidebar(!sidebarVisible)}>
                  Hide
                </a>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}

const Sidebar = (sidebar, onMenuItemClicked) => {
  const router = useRouter()
  let { category, slug } = router.query
  return Object.entries(sidebar || []).map(([heading, pages]) => {
    return (
      <div key={heading}>
        <p className="menu-label">{heading}</p>
        <ul className="menu-list">
          {pages.map(page => (
            <li key={page.slug}>
              <Link href={`/docs/[category]/[slug]`} as={`/docs/${category}/${page.slug}`}>
                <a
                  className={slug == page.slug ? 'is-active' : ''}
                  onClick={() => onMenuItemClicked(page)}
                >
                  {page.title}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  })
}
