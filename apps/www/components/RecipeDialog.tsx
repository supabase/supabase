import { Database, Code, Plus, Clock } from 'lucide-react'
import { Button } from 'ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

type RecipeType = 'query' | 'edge-function' | 'cron'

interface RecipeDialogProps {
  recipe: {
    title: string
    description: string
    type: RecipeType
    code: string
  } | null
  onClose: () => void
}

export default function RecipeDialog({ recipe, onClose }: RecipeDialogProps) {
  if (!recipe) return null

  return (
    <Dialog open={!!recipe} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="xlarge"
        className="grid grid-cols-2 items-stretch w-full max-w-[75vw] overflow-hidden"
      >
        <div className="flex flex-col justify-center p-12 max-h-screen bg-surface-100 min-h-96 relative">
          <div className="text-foreground-muted font-mono text-xs flex items-center gap-2 justify-end mb-4 absolute right-4 top-4">
            {recipe.type === 'edge-function' ? (
              <Code size={16} strokeWidth={1.5} />
            ) : recipe.type === 'cron' ? (
              <Clock size={16} strokeWidth={1.5} />
            ) : (
              <Database size={16} strokeWidth={1.5} />
            )}
            <span className="text-foreground-muted">{recipe.type}</span>
          </div>
          <div>
            <h2>{recipe.title}</h2>
            <p className="text-foreground-light">{recipe.description}</p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              type="default"
              onClick={() => {
                navigator.clipboard.writeText(recipe.code)
              }}
            >
              Remix with Assistant
            </Button>

            <Button icon={<Plus size="14" />} type="primary" onClick={onClose}>
              Add to project
            </Button>
          </div>
        </div>
        <div className="border-l bg">
          <CodeBlock
            lang={recipe.type === 'edge-function' ? 'ts' : recipe.type === 'cron' ? 'ts' : 'sql'}
            className="!rounded-none !bg h-full max-h-96 !border-none"
            showLineNumbers
            size="small"
          >
            {recipe.code}
          </CodeBlock>
        </div>
      </DialogContent>
    </Dialog>
  )
}
