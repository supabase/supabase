import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from 'ui'

interface FormFooterChangeBadgeProps {
  formState: {
    dirtyFields: Record<string, boolean>
  }
}
export const FormFooterChangeBadge = ({ formState }: FormFooterChangeBadgeProps) => {
  return (
    <AnimatePresence mode="wait">
      {Object.keys(formState.dirtyFields).length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              transition: { duration: 0.3 },
            }}
          >
            <Badge variant={'default'}>
              <motion.span
                key={Object.keys(formState.dirtyFields).length}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.1 }}
                className="text-sm"
              >
                {Object.keys(formState.dirtyFields).length === 1
                  ? '1 change to review'
                  : `${Object.keys(formState.dirtyFields).length} changes to review`}
              </motion.span>
            </Badge>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
