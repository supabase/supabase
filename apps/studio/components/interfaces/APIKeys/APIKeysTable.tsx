import { AnimatePresence } from 'framer-motion'

import { APIKeysData } from 'data/api-keys/api-keys-query'
import { APIKeyRow } from './APIKeyRow'

const APIKeysTable = ({
  apiKeys,
}: {
  apiKeys: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>[]
}) => {
  return (
    <table>
      <thead />
      <tbody>
        <AnimatePresence initial={false}>
          {apiKeys.map((apiKey) => (
            <APIKeyRow key={apiKey.id} apiKey={apiKey} />
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  )
}

export default APIKeysTable
