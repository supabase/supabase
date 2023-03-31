export type Link = {
  name: string
  link: string
}

export type Parameter = {
  id: string
  title: string
  description: string
  summary: string
  tags?: string[]
  links?: Link[]
  subcommands?: []
  usage?: string
  required?: boolean
  default?: boolean
}
