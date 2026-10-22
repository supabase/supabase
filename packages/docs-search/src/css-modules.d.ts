// `ui` is consumed as source and imports CSS modules; this lets it typecheck here.
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
