type ICommand = IActionCommand | IRouteCommand

type IBaseCommand = {
  name: string
  keywords?: Array<string>
  shortcut?: string
}

type IActionCommand = IBaseCommand & {
  action: () => void
}

type IRouteCommand = IBaseCommand & {
  route: `/${string}`
}

export type { ICommand }
