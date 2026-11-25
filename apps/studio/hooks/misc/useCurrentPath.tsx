import { useLocation } from '@tanstack/react-router'

export const useCurrentPath = () => {
  return useLocation({ select: (location) => location.pathname })
}
