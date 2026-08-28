interface UseRefreshOnOpenProps {
  isEnabled?: boolean
  refetch: () => unknown
}

export const useRefreshOnOpen = ({ isEnabled = true, refetch }: UseRefreshOnOpenProps) => {
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && isEnabled) void refetch()
  }

  return { handleOpenChange }
}
