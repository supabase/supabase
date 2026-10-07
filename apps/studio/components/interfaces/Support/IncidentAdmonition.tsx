import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

interface IncidentAdmonitionProps {
  isActive: boolean
  title: string
  description: string
  statusPageUrl: string
  className?: string
}

export function IncidentAdmonition({
  isActive,
  title,
  description,
  statusPageUrl,
  className,
}: IncidentAdmonitionProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.aside
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <Admonition
            type="warning"
            layout="horizontal"
            className={className}
            title={title}
            description={description}
            actions={
              <Button asChild icon={<ExternalLink strokeWidth={1.5} />}>
                <Link href={statusPageUrl} target="_blank" rel="noreferrer">
                  Status page
                </Link>
              </Button>
            }
          />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
