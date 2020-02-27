import React from 'react'

export default function Figure({ src, alt, caption }) {
  return (
    <div className="Figure">
      <figure>
        <img src={src} alt={alt} />
        <figcaption>{caption}</figcaption>
      </figure>
    </div>
  )
}
