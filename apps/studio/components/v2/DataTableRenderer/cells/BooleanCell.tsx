interface BooleanCellProps {
  value: unknown
}

export function BooleanCell({ value }: BooleanCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-foreground-lighter italic">NULL</span>
  }
  const bool = value === true || value === 'true' || value === 1
  return (
    <span className={bool ? 'text-brand font-medium' : 'text-foreground-lighter'}>
      {bool ? '✓' : '—'}
    </span>
  )
}
