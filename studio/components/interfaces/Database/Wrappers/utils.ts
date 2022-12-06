export const makeValidateRequired =
  (options: { name: string; required: boolean }[]) => (values: any) => {
    const requiredOptionsSet = new Set(
      options.filter((option) => option.required).map((option) => option.name)
    )

    const errors = Object.fromEntries(
      Object.entries(values)
        .filter(
          ([key, value]) =>
            requiredOptionsSet.has(key) && (Array.isArray(value) ? value.length < 1 : !value)
        )
        .map(([key]) => [key, 'Required'])
    )

    return errors
  }
