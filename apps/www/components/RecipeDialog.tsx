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

type RecipeType = 'query' | 'edge-function'

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
      <DialogContent size="xlarge" className="grid grid-cols-2 items-stretch">
        <div className="flex flex-col justify-center p-12 min-h-64">
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
              Copy to clipboard
            </Button>
            <Button type="primary" onClick={onClose}>
              Add to project
            </Button>
          </div>
        </div>
        <div className="border-l bg-surface-100">
          <CodeBlock
            lang={recipe.type === 'edge-function' ? 'ts' : 'sql'}
            className="!rounded-none !bg-surface-100 h-full max-h-96"
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
