export const isValidEdgeFunctionURL = (url: string) => {
  const regexValidEdgeFunctionURL = new RegExp(
    '^https://[a-z]*.supabase.(red|co)/functions/v[0-9]{1}/.*$'
  )

  return regexValidEdgeFunctionURL.test(url)
}
