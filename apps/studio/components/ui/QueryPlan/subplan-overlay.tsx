type Props = {
  subplanRoots?: { name: string; id: string }[]
}

export const SubplanOverlay = ({ subplanRoots }: Props) => {
  if (!subplanRoots || subplanRoots.length === 0) return null
  return (
    <div className="text-[10px] px-2 py-1 rounded bg-foreground-muted/20 backdrop-blur-sm border">
      <div>
        <span className="font-bold">Subplans:</span>{' '}
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
