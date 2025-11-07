import Link from 'next/link'
import { BookOpen, Code, Users, ExternalLink, BookA } from 'lucide-react'
import { IconYoutubeSolid } from 'ui'

interface ExploreItem {
  title: string
  link: string
  itemType?: string
  description?: string
}

interface ExploreMoreProps {
  items: ExploreItem[]
}

// Icon mapping based on itemType
function getIcon(itemType?: string) {
  if (!itemType) return BookOpen
  const lowerType = itemType.toLowerCase()
  if (lowerType === 'doc' || lowerType === 'documentation') {
    return BookA
  }
  if (lowerType === 'reference' || lowerType === 'api') {
    return Code
  }
  if (lowerType === 'community' || lowerType === 'forum') {
    return Users
  }
  if (lowerType === 'video' || lowerType === 'tutorial') {
    return IconYoutubeSolid
  }
  return BookA // default icon
}

// Default descriptions based on itemType
function getDescription(itemType?: string): string {
  if (!itemType) return 'Learn more about this topic'
  const lowerType = itemType.toLowerCase()
  if (lowerType === 'doc' || lowerType === 'documentation') {
    return 'Complete guides and references'
  }
  if (lowerType === 'reference' || lowerType === 'api') {
    return 'Detailed API documentation'
  }
  if (lowerType === 'community' || lowerType === 'forum') {
    return 'Get help from the community'
  }
  if (lowerType === 'video' || lowerType === 'tutorial') {
    return 'Watch video tutorials and guides'
  }
  return 'Learn more about this topic'
}

export function ExploreMore({ items }: ExploreMoreProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="mt-16 mb-8">
      <div className="border-t border-border pt-8">
        <h3 className="text-sm font-semibold text-foreground-lighter uppercase tracking-wider mb-6">
          Explore More
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => {
            const isExternal = item.link.startsWith('http://') || item.link.startsWith('https://')
            const Icon = getIcon(item.itemType)
            const description = item.description || getDescription(item.itemType)

            const cardContent = (
              <div className="relative bg-background border border-border rounded-lg shadow-sm p-6 h-full hover:shadow-md transition-shadow group">
                <div className="absolute top-4 right-4">
                  <ExternalLink className="h-4 w-4 text-foreground-lighter opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col gap-3">
                  <Icon className="h-6 w-6 text-foreground" />
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-foreground-light">{description}</p>
                  </div>
                </div>
              </div>
            )

            if (isExternal) {
              return (
                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {cardContent}
                </a>
              )
            }

            return (
              <Link key={index} href={item.link} className="block">
                {cardContent}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
