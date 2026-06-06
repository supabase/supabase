import { COLLABORATOR_500_COLORS } from './participantColors'

export type AugmentedUser = {
  id: string
  name: string
  color: string
}

/** Fixed demo collaborators — not live sessions. */
export const AUGMENTED_USERS: AugmentedUser[] = [
  { id: 'jonny', name: 'Jonny', color: COLLABORATOR_500_COLORS[6]! }, // blue-500
  { id: 'paul', name: 'Paul', color: COLLABORATOR_500_COLORS[9]! }, // purple-500
  { id: 'ant', name: 'Ant', color: COLLABORATOR_500_COLORS[1]! }, // orange-500
  { id: 'matt', name: 'Matt', color: COLLABORATOR_500_COLORS[8]! }, // cyan-500
]

export const AUGMENTED_USER_COUNT = AUGMENTED_USERS.length
