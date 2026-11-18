type CliFlag = {
  name: string
  required?: boolean
  default_value?: string | number | boolean | null
}

export function CliFlagDefault({ flag }: { flag: CliFlag }) {
  const value = flag.default_value
  if (value == null || value === '') return null
  // Required values use " <value>"; optional values use "[=<value>]" in the CLI spec.
  if (!flag.required && String(value) === 'false' && !flag.name.includes(' <')) return null

  return (
    <p className="text-sm text-foreground-light">
      <strong>Default:</strong> <code>{String(value)}</code>
    </p>
  )
}
