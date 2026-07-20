import Image from 'next/image'

import type Author from '@/types/author'

interface Props {
  authors: (Author | undefined)[]
  showName?: boolean
  size?: 'sm' | 'md'
}

const MAX_VISIBLE_AVATARS = 3

export default function AuthorAvatars({ authors, showName = true, size = 'sm' }: Props) {
  const valid = authors.filter(Boolean) as Author[]
  if (!valid.length) return null

  const px = size === 'md' ? 'w-6 h-6' : 'w-5 h-5'
  const visibleAvatars = valid.slice(0, MAX_VISIBLE_AVATARS)
  const hiddenCount = valid.length - visibleAvatars.length

  const nameLabel =
    valid.length > 2
      ? `${valid[0].author} +${valid.length - 1} other${valid.length - 1 > 1 ? 's' : ''}`
      : valid.map((a) => a.author).join(', ')

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center -space-x-1.5 shrink-0">
        {visibleAvatars.map((author, i) => (
          <div
            key={i}
            className={`relative ${px} rounded-full ring-2 ring-background border border-foreground/20 overflow-hidden shrink-0`}
          >
            {author.author_image_url && (
              <Image
                src={
                  typeof author.author_image_url === 'string'
                    ? author.author_image_url
                    : (author.author_image_url as { url: string }).url
                }
                fill
                className="object-cover"
                alt={showName ? '' : author.author}
              />
            )}
          </div>
        ))}
        {hiddenCount > 0 && (
          <div
            className={`relative ${px} rounded-full ring-2 ring-background border border-foreground/20 shrink-0 bg-surface-300 flex items-center justify-center`}
            aria-hidden="true"
          >
            <span className="text-foreground-lighter text-[9px] leading-none">
              +{hiddenCount}
            </span>
          </div>
        )}
      </div>
      {showName && (
        <p className="text-foreground-lighter text-xs truncate min-w-0">{nameLabel}</p>
      )}
    </div>
  )
}
