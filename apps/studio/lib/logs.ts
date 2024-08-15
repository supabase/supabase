export function filterFunctionsRequestResponse(re: any) {
  return Object.fromEntries(
    Object.entries(re)
      .filter(([key]) => !['host', 'url'].includes(key))
      .map(([key, value]) => {
        if (key === 'headers') {
          return [
            key,
            (value as any[]).map((headers) =>
              Object.fromEntries(Object.entries(headers).filter(([key]) => !key.startsWith('_')))
            ),
          ]
        }

        return [key, value]
      })
  )
}
