export interface Timezone {
  value: string
  abbr: string
  offset: number
  isdst: boolean
  text: string
  utc: string[]
}

export interface Time {
  h: number
  m: number
  s: number
}
