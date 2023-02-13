import React, { useState } from 'react'
import extensions from '../data/extensions.json'

export default function Extensions() {
  const [filter, setFilter] = useState('')
  return (
    <>
      <div className="mb-8 grid">
        <label className="text-xs mb-2">Filter extensions</label>
        <input
          type="text"
          className="border text-gray-200"
          placeholder="Extension name"
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {extensions
          .filter((x) => x.name.indexOf(filter) >= 0)
          .map((extension) => (
            <div className={' my-2 px-2'} key={extension.name}>
              <div className="border rounded-sm p-4">
                <h3 className="m-0">
                  <code className="text-sm">{extension.name}</code>
                </h3>
                <p className=" mt-4">
                  {extension.comment.charAt(0).toUpperCase() + extension.comment.slice(1)}
                </p>
              </div>
            </div>
          ))}
      </div>
    </>
  )
}
