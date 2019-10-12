import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [mobileActive, setMobileActive] = useState(false)

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
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
          <div className="navbar-item has-dropdown is-hoverable">
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
          </div>

          {/* Apps */}
          <div className="navbar-item has-dropdown is-hoverable">
            <span className="navbar-link">
              Apps
            </span>
            <div className="navbar-dropdown is-boxed  is-right">
              <a className="navbar-item" href="">
                <div className="navbar-content">
                  <h5 className="has-text-weight-bold">API</h5>
                  <p>Deploy a fully documented RestFUL API without a single bit of code.</p>
                </div>
              </a>
              <a className="navbar-item" href="">
                <div className="navbar-content">
                  <h5 className="has-text-weight-bold">GraphQL</h5>
                  <p>Deploy a fully documented GraphQL API without a single bit of code.</p>
                </div>
              </a>
              <a className="navbar-item" href="">
                <div className="navbar-content">
                  <h5 className="has-text-weight-bold">Forms</h5>
                  <p>Customisable, validated, embeddable forms that save data directly to your database.</p>
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
          </div>

          <div className="navbar-item">
            <Link href="/blog">
              <a className="">Blog</a>
            </Link>
          </div>
          <div className="navbar-item">
            <Link href="/">
              <a className="button is-primary">Subscribe</a>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
