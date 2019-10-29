import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar({ }) {
  const router = useRouter()
  let { category } = router.query
  return (
    <nav className="tabs m-none">
      <ul>
        <li className={category == '-' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/-/about`}>
            <a className="">Supabase</a>
          </Link>
        </li>
        <li className={category == 'packaged' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/packaged/introduction`}>
            <a className="">Packaged</a>
          </Link>
        </li>
        <li className={category == 'admin-api' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/admin-api/introduction`}>
            <a className="">Admin API</a>
          </Link>
        </li>
        <li className={category == 'realtime' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/realtime/introduction`}>
            <a className="">Realtime</a>
          </Link>
        </li>
        <li className={category == 'restful' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/restful/introduction`}>
            <a className="">Restful</a>
          </Link>
        </li>
        <li className={category == 'graphql' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/graphql/introduction`}>
            <a className="">GraphQL</a>
          </Link>
        </li>
        <li className={category == 'baseless' ? 'is-active' : ''}>
          <Link href={`/docs/[category]/[slug]`} as={`/docs/baseless/introduction`}>
            <a className="">Baseless</a>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
