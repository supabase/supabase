export const SELECT_26_BANNER_PRIORITY = -1

export const shouldShowSelect26Banner = ({
  isPlatform,
  projectRef,
  dismissalLoaded,
  isActive,
  isDismissed,
}: {
  isPlatform: boolean
  projectRef?: string
  dismissalLoaded: boolean
  isActive: boolean
  isDismissed: boolean
}) => isPlatform && !!projectRef && dismissalLoaded && isActive && !isDismissed
