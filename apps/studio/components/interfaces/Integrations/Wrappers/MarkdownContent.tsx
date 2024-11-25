import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from 'ui'

const CHAR_LIMIT = 500 // Adjust this number as needed

export const MarkdownContent = () => {
  const { id } = useParams()
  const [content, setContent] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    import(`static-data/integrations/${id}/overview.md`)
      .then((module) => setContent(String(module.default)))
      .catch((error) => console.error('Error loading markdown:', error))
  }, [id])

  const displayContent = isExpanded ? content : content.slice(0, CHAR_LIMIT)

  return (
    <div className="px-10">
      <div className="relative">
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 80 }}
          className="overflow-hidden"
          transition={{ duration: 0.4 }}
        >
          <Markdown content={displayContent} className="!max-w-3xl" />
        </motion.div>
        {!isExpanded && (
          <div
            className={cn(
              'bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background-200 to-transparent',
              !isExpanded ? 'absolute' : 'relative'
            )}
          />
        )}
        {content.length > CHAR_LIMIT && (
          <div className={cn('bottom-0 z-10', !isExpanded ? 'absolute' : 'relative mt-3')}>
            <button
              className="text-foreground-light hover:text-foreground underline text-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
