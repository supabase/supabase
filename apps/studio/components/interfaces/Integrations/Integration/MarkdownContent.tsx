import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const CHAR_LIMIT = 750 // Adjust this number as needed

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
          animate={{ height: isExpanded ? 'auto' : 256 }}
          className="overflow-hidden"
          transition={{ duration: 0.4 }}
        >
          <Markdown content={displayContent} className="!max-w-3xl" />
        </motion.div>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-scale-100 to-transparent" />
        )}
        {content.length > CHAR_LIMIT && (
          <div className="-bottom-10 absolute z-10">
            <button
              className="asbolute text-foreground-light hover:text-foreground underline text-sm"
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
