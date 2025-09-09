import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { data as DevelopersData } from 'data/Developers'
import staticContent from '.generated/staticContent/_index.json'

type LinkProps = {
  text: string
  description?: string
  url?: string
  icon?: any
  svg?: any
}

export const DevelopersDropdown = () => (
  <div className="flex flex-col xl:flex-row">
    <div className="w-[550px] xl:w-[470px] py-8 px-8 bg-background grid gap-3 grid-cols-2">
      {DevelopersData['navigation'].map((column) => (
        <div key={column.label} className="p-0 flex flex-col gap-6">
          <label className="text-foreground-lighter text-xs uppercase tracking-widest font-mono">
            {column.label}
          </label>
          <ul className="flex flex-col gap-4">
            {column.links.map(({ icon: Icon, ...link }: LinkProps) => (
              <li key={link.text}>
                <Link
                  href={post.url}
                  className="group flex flex-col focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded"
                >
                  <p className="text-foreground-light mb-0 line-clamp-2 group-hover:text-foreground group-focus-visible:text-foreground">
                    {post.title}
                  </p>
                  <p className="text-sm line-clamp-2 text-foreground-lighter leading-relaxed !mb-0 group-hover:text-foreground-light group-focus-visible:text-foreground-light">
                    {post.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
)
}

export default DevelopersDropdown
