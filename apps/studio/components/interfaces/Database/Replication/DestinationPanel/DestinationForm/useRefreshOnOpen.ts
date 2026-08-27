import { useEffect, useState } from 'react'

interface UseRefreshOnOpenProps {
  enabled?: boolean
  refetch: () => unknown
}

export const useRefreshOnOpen = ({ enabled = true, refetch }: UseRefreshOnOpenProps) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && enabled) void refetch()
  }, [enabled, open, refetch])

  return setOpen
}
