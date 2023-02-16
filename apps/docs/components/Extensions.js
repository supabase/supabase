import Link from 'next/link'
import React, { useState } from 'react'
import { GlassPanel, IconSearch, Input } from 'ui'
import extensions from '../data/extensions.json'

export default function Extensions() {
  const [filter, setFilter] = useState('')
  return (
    <>
      <div className="mb-8 grid not-prose">
        <Input
          placeholder="Search extensions"
          icon={<IconSearch />}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 not-prose">
        {extensions
          .filter((x) => x.name.indexOf(filter) >= 0)
          .map((extension) => (
            <Link passHref href={`/guides/database/extensions/${extension.name}`}>
              <a>
                <GlassPanel
                  title={<code>{extension.name}</code>}
                  background={false}
                  key={extension.name}
                >
                  <p className=" mt-4">
                    {extension.comment.charAt(0).toUpperCase() + extension.comment.slice(1)}
                  </p>
                </GlassPanel>
              </a>
            </Link>
          ))}
      </div>
    </>
  )
}
