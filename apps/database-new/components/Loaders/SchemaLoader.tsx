import { Loader2 } from 'lucide-react'

const SchemaLoader = () => {
  return (
    <div className="h-full w-full text-muted justify-start">
      <div className="flex items-center m-4 gap-2">
        <Loader2 className="animate-spin opacity-100" size={16} strokeWidth={1} />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  )
}

export default SchemaLoader
