type CliFlag = {
  name: string
  required?: boolean
  default_value?: string | number | boolean | null
}

export function CliFlagDefault({ flag }: { flag: CliFlag }) {
  const value = flag.default_value
  if (value == null || value === '') return null
  // The CLI spec includes a <metavariable> in the name of flags that take a value.
  if (!flag.required && String(value) === 'false' && !flag.name.includes('<')) return null

  return (
    <p className="text-sm text-foreground-light">
      Default: <code>{String(value)}</code>
    </p>
  )
}
