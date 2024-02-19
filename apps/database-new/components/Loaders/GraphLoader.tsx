import { Loader2 } from 'lucide-react'

const GraphLoader = () => {
  return (
    <div className="h-full w-full text-muted justify-start border-l">
      <div className="flex gap-4">
        <LineNumbers />
        <div>
          <div className="mt-4 flex items-center gap-2">
            <Loader2 className="animate-spin opacity-100" size={16} strokeWidth={1} />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GraphLoader

const LineNumbers = () => {
  const lines = [1, 2, 3, 4, 5, 6]
  return (
    <div className="grid gap-2 border-r py-4 px-4 text-sm font-mono text-muted">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  )
}
