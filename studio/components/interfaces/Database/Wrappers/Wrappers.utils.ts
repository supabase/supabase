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
        .map(([key]) => {
          if (key === 'table_name') return [key, 'Please provide a name for your table']
          else if (key === 'columns') return [key, 'Please select at least one column']
          else return [key, 'This field is required']
        })
    )

    return errors
  }
