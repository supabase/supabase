import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {

  return (
    <nav className="tabs m-none">
      <ul>
        <li className="is-active">
          <Link href="/docs/packaged/getting-started">
            <a className="">Packaged</a>
          </Link>
        </li>
        <li>
          <Link href="/docs/admin-api/getting-started">
            <a className="">Admin API</a>
          </Link>
        </li>
        <li>
          <Link href="/realtime">
            <a className="">Realtime</a>
          </Link>
        </li>
        <li>
          <Link href="/realtime">
            <a className="">Rest</a>
          </Link>
        </li>
        <li>
          <Link href="/realtime">
            <a className="">GraphQL</a>
          </Link>
        </li>
        <li>
          <Link href="/realtime">
            <a className="">Baseless</a>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
