import React from 'react'

export default function ContributorList({ list }) {
  let users = list.map((x, i )=> (
    <>
      <a target="_blank" href={`https://github.com/${x.username}`}>
        @{x.username}
      </a>
      {i < list.length - 1 && ', '}
    </>
  ))
  console.log('users', users)

  return users
}
