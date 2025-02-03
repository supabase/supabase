import { AnimatePresence } from 'framer-motion'
import APIKeyRow from './APIKeyRow'
import { APIKeysData } from 'data/api-keys/api-keys-query'
// ... other imports

const APIKeysTable = ({
  apiKeys,
}: {
  apiKeys: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>[]
}) => {
  return (
    <table>
      <thead>{/* ... table header */}</thead>
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
