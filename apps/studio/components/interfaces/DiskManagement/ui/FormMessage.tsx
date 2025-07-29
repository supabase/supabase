import { AnimatePresence, motion } from 'framer-motion'
import { Admonition } from 'ui-patterns'

interface FormMessageProps {
  message: string
  type?: 'error' | 'success'
  children?: React.ReactNode
}

function FormMessage({ message = 'error', type, children }: FormMessageProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Admonition
            type={type === 'error' ? 'destructive' : 'default'}
            className="mt-2"
            title={message}
          >
            {children}
          </Admonition>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FormMessage
