import { FolderTree } from 'lucide-react'

interface ConnectPathProps {
  path: string
}
const ConnectPath = ({ path }: ConnectPathProps) => {
  return (
    <div className="items-center gap-2 font-mono text-sm bg-surface-200 p-2 inline-flex rounded-lg mb-4">
      <FolderTree size={14} />
      {path}
    </div>
  )
}

export default ConnectPath
