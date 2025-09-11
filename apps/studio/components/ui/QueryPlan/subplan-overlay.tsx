import { cn } from 'ui'

type Props = {
  subplanRoots?: { name: string; id: string }[]
  className?: string
}

export const SubplanOverlay = ({ subplanRoots, className }: Props) => {
  if (!subplanRoots || subplanRoots.length === 0) return null

  return (
    <div
      className={cn(
        'text-[9px] px-2 py-1 rounded-md bg-foreground-muted/20 backdrop-blur-sm border',
        className
      )}
    >
      <div>
        <span>Subplans:</span>{' '}
        {subplanRoots.map((sp, i) => (
          <span key={sp.id}>
            {sp.name}
            {i < (subplanRoots.length ?? 0) - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
