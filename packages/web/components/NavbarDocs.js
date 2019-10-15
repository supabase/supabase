import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar({activeCategory}) {
  return (
    <nav className="tabs m-none">
      <ul>
        <li className="is-hidden-tablet">
          <a>
          <span class="icon">
            <i class="fas fa-bars"></i>
          </span>
          </a>
        </li>
        <li className={activeCategory == 'packaged' ? 'is-active': ''}>
          <Link href="/docs/packaged/getting-started">
            <a className="">Packaged</a>
          </Link>
        </li>
        <li className={activeCategory == 'admin-api' ? 'is-active': ''}>
          <Link href="/docs/admin-api/getting-started">
            <a className="">Admin API</a>
          </Link>
        </li>
        <li className={activeCategory == 'realtime' ? 'is-active': ''}>
          <Link href="/docs/realtime/getting-started">
            <a className="">Realtime</a>
          </Link>
        </li>
        <li className={activeCategory == 'rest' ? 'is-active': ''}>
          <Link href="/realtime">
            <a className="">Rest</a>
          </Link>
        </li>
        <li className={activeCategory == 'graphql' ? 'is-active': ''}>
          <Link href="/realtime">
            <a className="">GraphQL</a>
          </Link>
        </li>
        <li className={activeCategory == 'baseless' ? 'is-active': ''}>
          <Link href="/realtime">
            <a className="">Baseless</a>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
