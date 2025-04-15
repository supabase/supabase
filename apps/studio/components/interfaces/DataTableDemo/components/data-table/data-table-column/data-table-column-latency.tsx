export function DataTableColumnLatency({ value }: { value: number }) {
  return (
    <div className="font-mono">
      {new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(
        value,
      )}
      <span className="text-muted-foreground">ms</span>
    </div>
  );
}
