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
      <DialogContent size="xlarge">
        <DialogHeader padding="small">
          <DialogTitle>{recipe.title}</DialogTitle>
          <DialogDescription>{recipe.description}</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection padding="small">
          <CodeBlock
            lang={recipe.type === 'edge-function' ? 'ts' : 'sql'}
            className="!rounded-md"
            size="small"
            hideCopy
          >
            {recipe.code}
          </CodeBlock>
        </DialogSection>
        <DialogFooter padding="small">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
