export interface Timezone {
  value: string
  abbr: string
  offset: number
  isdst: boolean
  text: string
  utc: string[]
}

export interface Time {
  h: string
  m: string
  s: string
}
