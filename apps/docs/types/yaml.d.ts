declare module '*.yml' {
  import { Json } from '.'

  const value: Json
  export default value
}

declare module '*.yaml' {
  import { Json } from '.'

  const value: Json
  export default value
}
