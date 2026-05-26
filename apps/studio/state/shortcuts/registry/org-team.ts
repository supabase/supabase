import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

export const ORG_TEAM_SHORTCUT_IDS = {
  ORG_TEAM_INVITE: 'org.team-invite',
  ORG_TEAM_INVITE_SUBMIT: 'org.team-invite-submit',
} as const

export type OrgTeamShortcutId = (typeof ORG_TEAM_SHORTCUT_IDS)[keyof typeof ORG_TEAM_SHORTCUT_IDS]

export const orgTeamRegistry: RegistryDefinations<OrgTeamShortcutId> = {
  [ORG_TEAM_SHORTCUT_IDS.ORG_TEAM_INVITE]: {
    id: ORG_TEAM_SHORTCUT_IDS.ORG_TEAM_INVITE,
    label: 'Invite members',
    sequence: ['Shift+N'],
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_TEAM,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [ORG_TEAM_SHORTCUT_IDS.ORG_TEAM_INVITE_SUBMIT]: {
    id: ORG_TEAM_SHORTCUT_IDS.ORG_TEAM_INVITE_SUBMIT,
    label: 'Send invitation(s)',
    sequence: ['Mod+Enter'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_TEAM,
  },
}
