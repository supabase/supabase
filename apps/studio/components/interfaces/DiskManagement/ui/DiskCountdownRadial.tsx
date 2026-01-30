import { AnimatePresence } from 'framer-motion'

import { useParams } from 'common'
import { useRemainingDurationForDiskAttributeUpdate } from 'data/config/disk-attributes-query'
import FormMessage from './FormMessage'

export function DiskCountdownRadial() {
  const { ref } = useParams()

  const { error } = useRemainingDurationForDiskAttributeUpdate({
    projectRef: ref,
  })

  // AWS now allows up to 4 modifications in 24 hours without mandatory wait time.
  // We no longer show a countdown - server will return an error if limit is exceeded.
  return (
    <AnimatePresence>
      {error && <FormMessage message={error.message} type="error" />}
    </AnimatePresence>
  )
}
