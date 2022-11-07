import React from 'react'

export default function GithubCard({ title, description, href, stars, handle }) {
  return (
    <a className="h-full" href={href}>
      <div className="card__body">
        <h4 className="uppercase my-2 font-semibold">{title}</h4>
        <span className="text-sm">{description}</span>
      </div>
      <hr className="my-2" />
      <div className="flex justify-between py-2 text-xs">
        <div>@{handle}</div>
        <div>{stars} ★</div>
      </div>
    </a>
  )
}
