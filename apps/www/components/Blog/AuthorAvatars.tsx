import Image from 'next/image'
import type Author from '@/types/author'

interface Props {
  authors: (Author | undefined)[]
  showName?: boolean
  size?: 'sm' | 'md'
}

export default function AuthorAvatars({ authors, showName = true, size = 'sm' }: Props) {
  const valid = authors.filter(Boolean) as Author[]
  if (!valid.length) return null

  const px = size === 'md' ? 'w-6 h-6' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-1.5">
        {valid.map((author, i) => (
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
                alt={author.author}
              />
            )}
          </div>
        ))}
      </div>
      {showName && (
        <p className="text-foreground-lighter text-xs truncate">
          {valid.map((a) => a.author).join(', ')}
        </p>
      )}
    </div>
  )
}
