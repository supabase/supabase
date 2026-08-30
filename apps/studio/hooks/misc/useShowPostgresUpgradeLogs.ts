import { useFlag } from 'common'

export const useShowPostgresUpgradeLogs = () => {
  return useFlag('showPostgresUpgradeLogs')
}
