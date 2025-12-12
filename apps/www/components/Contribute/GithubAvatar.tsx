import Image from 'next/image'
import Link from 'next/link'

interface GithubAvatarProps {
  username: string
  size?: number
  className?: string
}

export function GithubAvatar({ username, size = 40, className }: GithubAvatarProps) {
  return (
    <Link
      href={`https://github.com/${username}`}
      target="_blank"
      rel="noreferrer"
      className="group relative"
    >
      <Image
        src={`https://github.com/${username}.png`}
        alt={`${username}'s GitHub avatar`}
        width={size}
        height={size}
        className={`${className} transition-all duration-200 group-hover:scale-110 group-hover:ring-2 group-hover:ring-brand-500 group-hover:ring-offset-2 group-hover:ring-offset-background`}
      />
    </Link>
  )
}
