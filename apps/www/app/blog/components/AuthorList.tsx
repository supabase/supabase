'use client'

import Image from 'next/image'
import Link from 'next/link'

type Author = {
  author: string
  author_image_url: string | { url: string } | null
  author_url: string
  position: string
}

interface AuthorListProps {
  authors: Author[]
}

export const AuthorList = ({ authors }: AuthorListProps) => {
  if (authors.length === 0) return null

  return (
    <div className="hidden lg:flex justify-between">
      <div className="flex-1 flex flex-col gap-3 pt-2 md:flex-row md:gap-0 lg:gap-3">
        {authors.map((author, i: number) => {
          const imageUrl = !author.author_image_url
            ? ''
            : typeof author.author_image_url === 'string'
              ? author.author_image_url
              : author.author_image_url.url

          return (
            <div className="mr-4 w-max" key={i}>
              <Link href={author.author_url} target="_blank" className="cursor-pointer">
                <div className="flex items-center gap-3">
                  {imageUrl && (
                    <div className="w-10">
                      <Image
                        src={imageUrl}
                        className="border-default rounded-full border w-full aspect-square object-cover"
                        alt={`${author.author} avatar`}
                        width={40}
                        height={40}
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-foreground mb-0 text-sm">{author.author}</span>
                    <span className="text-foreground-lighter mb-0 text-xs">{author.position}</span>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
