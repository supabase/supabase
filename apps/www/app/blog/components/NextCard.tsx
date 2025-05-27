'use client'

import Link from 'next/link'

type NextCardProps = {
  post: {
    path: string
    title: string
    formattedDate: string
  }
  label: string
  className?: string
}

export const NextCard = ({ post, label, className }: NextCardProps) => {
  return (
    <Link href={`${post.path}`} as={`${post.path}`}>
      <div className={className}>
        <div className="hover:bg-control cursor-pointer rounded border p-6 transition">
          <div className="space-y-4">
            <div>
              <p className="text-foreground-lighter text-sm">{label}</p>
            </div>
            <div>
              <h4 className="text-foreground text-lg">{post.title}</h4>
              <p className="small">{post.formattedDate}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
