// todo: figure out the proper nuxt plugin for doing this
export function useFormatDateTime(date: Date) {
  return (new Intl.DateTimeFormat('en-US', { dateStyle: "short", timeStyle: "medium" }).format(date))
}

export function useFormatDateTimeString(dateString: string) {
  return (new Intl.DateTimeFormat('en-US', { dateStyle: "short", timeStyle: "short" }).format((new Date(dateString))))
}

export function useFormatDateTimeTicks(ticks: number) {
  return (new Intl.DateTimeFormat('en-US', { dateStyle: "short", timeStyle: "medium" }).format((new Date(ticks))))
}