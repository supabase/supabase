import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar({}) {
  const router = useRouter()
  let { category } = router.query
  return (
    <nav className="tabs m-none">
      <ul>
        <li className="is-hidden-tablet">
          <a>
            <span className="icon">
              <i className="fas fa-bars"></i>
            </span>
          </a>
        </li>
        <li className={category == 'packaged' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/packaged/getting-started`}>
            <a className="">Packaged</a>
          </Link>
        </li>
        <li className={category == 'admin-api' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/admin-api/getting-started`}>
            <a className="">Admin API</a>
          </Link>
        </li>
        <li className={category == 'realtime' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/realtime/getting-started`}>
            <a className="">Realtime</a>
          </Link>
        </li>
        <li className={category == 'rest' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/restful/getting-started`}>
            <a className="">Restful</a>
          </Link>
        </li>
        <li className={category == 'graphql' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/graphql/getting-started`}>
            <a className="">GraphQL</a>
          </Link>
        </li>
        <li className={category == 'baseless' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/baseless/getting-started`}>
            <a className="">Baseless</a>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
