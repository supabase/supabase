import { FC, useState } from 'react'
import { Input } from '~/../../packages/ui'

type Props = {
  onClose?: () => void
}

const ClippyModal: FC<Props> = ({ onClose }) => {
  const [query, setQuery] = useState('')

  return (
    <div
      className="flex flex-col items-center fixed top-0 left-0 w-screen h-screen p-4 md:p-[12vh] backdrop-blur-sm z-50 cursor-pointer bg-black/30"
      onClick={onClose}
    >
      <div
        className={`mx-auto flex rounded-lg p-6 w-full max-w-2xl shadow-2xl overflow-hidden border text-left border-scale-500 dark:bg-scale-300 cursor-auto`}
      >
        <Input
          className="w-full"
          size="xlarge"
          autoFocus
          placeholder="What can I help you with?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </div>
  )
}

export default ClippyModal
