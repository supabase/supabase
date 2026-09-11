export const SELECT_26_BANNER_PRIORITY = -1

export const shouldShowSelect26Banner = ({
  isPlatform,
  dismissalLoaded,
  isActive,
  isDismissed,
}: {
  isPlatform: boolean
  dismissalLoaded: boolean
  isActive: boolean
  isDismissed: boolean
}) => isPlatform && dismissalLoaded && isActive && !isDismissed
