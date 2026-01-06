import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DestinationType } from '../DestinationPanel.types'

const sharedPipelineMessages = [
  'Looking for your publication...',
  'Checking WAL level settings...',
  'Counting replication slots...',
  'Verifying replication permissions...',
  'Making sure your publication has tables...',
  'Checking primary keys...',
  'Looking for generated columns...',
]

const bigQueryMessages = [
  'Authenticating with BigQuery...',
  'Verifying your service account key...',
  'Checking if your dataset exists...',
  'Testing BigQuery API access...',
  'Confirming dataset permissions...',
]

const analyticsBucketMessages = [
  'Connecting to Iceberg catalog...',
  'Validating warehouse access...',
  'Testing S3 credentials...',
  'Checking bucket permissions...',
  'Verifying catalog token...',
]

const finalMessages = ['Running final checks...', 'Wrapping things up...']

interface ValidationOverlayProps {
  isVisible: boolean
  destinationType: DestinationType
}

export const ValidationOverlay = ({ isVisible, destinationType }: ValidationOverlayProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const validationMessages = useMemo(() => {
    const destinationSpecificMessages =
      destinationType === 'BigQuery'
        ? bigQueryMessages
        : destinationType === 'Analytics Bucket'
          ? analyticsBucketMessages
          : [] // Read Replica or future types

    return [...sharedPipelineMessages, ...destinationSpecificMessages, ...finalMessages]
  }, [destinationType])

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % validationMessages.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [isVisible, validationMessages.length])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-2 px-8 max-w-xl w-full">
        {/* Title */}
        <h3 className="text-lg font-medium text-foreground">Running pre-flight checks</h3>

        {/* Cycling Messages */}
        <div className="relative h-12 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center text-center"
            >
              <p className="text-sm text-foreground-lighter whitespace-nowrap">
                {validationMessages[currentMessageIndex]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="w-2 h-2 rounded-full bg-brand"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
