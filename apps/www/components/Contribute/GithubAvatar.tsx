'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface GithubAvatarProps {
  username: string
  size?: number
  className?: string
}

// Basic username validation - GitHub usernames must be alphanumeric with hyphens/underscores
function isValidGithubUsername(username: string): boolean {
  if (!username || username.trim().length === 0) return false
  // GitHub username rules: alphanumeric, hyphens, underscores, no consecutive hyphens/underscores, max 39 chars
  const githubUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?!-)|_(?!_))*[a-zA-Z0-9]?$/
  return username.length <= 39 && githubUsernameRegex.test(username)
}

export function GithubAvatar({ username, size = 80, className }: GithubAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(`https://github.com/${username}.png`)

  // Validate username and use fallback if invalid
  const isValid = isValidGithubUsername(username)
  const fallbackSrc = isValid
    ? `https://github.com/identicons/${username}.png`
    : '/images/blog/blog-placeholder.png'

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true)
      setImageSrc(fallbackSrc)
    }
  }

  return (
    <Link
      href={`https://github.com/${username}`}
      target="_blank"
      rel="noreferrer"
      className="group relative"
    >
      <Image
        src={imageSrc}
        alt={`${username}'s GitHub avatar`}
        width={size}
        height={size}
        className={`${className} transition-all duration-200 group-hover:scale-110 group-hover:ring-2 group-hover:ring-brand-500 group-hover:ring-offset-2 group-hover:ring-offset-background`}
        onError={handleImageError}
      />
    </Link>
  )
}
