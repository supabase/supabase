import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [mobileActive, setMobileActive] = useState(false)

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="container">
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
          {/* Plugins */}
          {/* <div className="navbar-item has-dropdown is-hoverable">
            <span className="navbar-link">
              Plugins
            </span>
            <div className="navbar-dropdown is-boxed  is-right">
              <a className="navbar-item" href="">
                <div className="navbar-content">
                  <h5 className="has-text-weight-bold">PostGIS</h5>
                  <p>Supercharge your database to work with locations and geographies.</p>
                </div>
              </a>
              <a className="navbar-item" href="">
                <div className="navbar-content">
                  <h5 className="has-text-weight-bold">Timescale</h5>
                  <p>Supercharge your database to work with time series data.</p>
                </div>
              </a>
              <hr className="navbar-divider" />
              <a className="navbar-item" href="">
                <span className="">See all</span>
                <span className="icon">
                  <i className="fas fa-arrow-right"></i>
                </span>
              </a>
            </div>
          </div> */}


          <div className="navbar-item">
              <a className="https://docs.supabase.io">Docs</a>
          </div>
          {/* <div className="navbar-item">
            <Link href="/blog">
              <a className="">Blog</a>
            </Link>
          </div> */}
          <div className="navbar-item">
            <Link href="/">
              <a className="button is-primary">Sign up</a>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </nav>
  )
}
