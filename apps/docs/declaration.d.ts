declare module '*.include' {
  const content: string
  export default content
}

declare module '*.toml' {
  const content: any
  export default content
}
