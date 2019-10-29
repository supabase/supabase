import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import WidthWrapper from '~/components/WidthWrapper'

export default function Navbar({ isFullwidth }) {
  const [mobileActive, setMobileActive] = useState(false)

  
  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <WidthWrapper isFullwidth={isFullwidth}>
        <div className="navbar-brand">
          <Link href="/">
            <a className="navbar-item has-text-weight-bold">
              <img src="/supabase-logo.svg" alt="Supabase" />
            </a>
          </Link>

          <a
            role="button"
            className="navbar-burger burger"
            aria-label="menu"
            aria-expanded="false"
            data-target="navbarBasicExample"
            onClick={() => setMobileActive(!mobileActive)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </a>
        </div>

        <div id="navbarBasicExample" className={`navbar-menu ${mobileActive ? 'is-active' : ''}`}>
          <div className="navbar-start"></div>

          <div className="navbar-end p-r-sm">
            <div className="navbar-item">
              <Link href={`/docs/[category]/[slug]`} as={`/docs/realtime/introduction`}>
                <a className="">Docs</a>
              </Link>
            </div>
          </div>
        </div>
      </WidthWrapper>
    </nav>
  )
}
