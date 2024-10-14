import { AnimatePresence } from 'framer-motion'
import APIKeyRow from './APIKeyRowv2'
// ... other imports

const APIKeysTable = ({ apiKeys }: { apiKeys: APIKeysData }) => {
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
