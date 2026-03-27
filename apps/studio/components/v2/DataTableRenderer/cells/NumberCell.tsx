interface NumberCellProps {
  value: unknown
}

export function NumberCell({ value }: NumberCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-foreground-lighter italic">NULL</span>
  }
  const num = Number(value)
  if (Number.isNaN(num)) {
    return <span className="truncate">{String(value)}</span>
  }
  return <span className="truncate tabular-nums text-right w-full">{num.toLocaleString()}</span>
}
