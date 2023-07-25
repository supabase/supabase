import { UserData } from './use-conf-data'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'

function calculateWinChances(userData: UserData): number {
  // Just signing up gives you 1
  // Then signing up with LinkedIn and Twitter get you one more each for a total of 3
  // When the chance === 3, you have a golden ticket
  let numChances = 1

  if (userData.sharedOnLinkedIn) {
    numChances++
  }
  if (userData.sharedOnTwitter) {
    numChances++
  }

  return numChances
}

export default function useWinningChances() {
  const { userData } = useConfData()

  const chances = calculateWinChances(userData)
  return chances
}
