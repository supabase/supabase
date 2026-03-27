interface TextCellProps {
  value: unknown
}

export function TextCell({ value }: TextCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-foreground-lighter italic">NULL</span>
  }
  return <span className="truncate">{String(value)}</span>
}
