import * as Tooltip from '@radix-ui/react-tooltip'
import { useState } from 'react'
import { Button, IconSearch, Input } from 'ui'

import { useParams } from 'common/hooks'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { delete_, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useProfile } from 'lib/profile'
import {
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldActionsContainer,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import NewRoleButton from './NewRoleButton'
import RolesView from './RolesView'

const PermissionsSettings = () => {
  const { ui } = useStore()
  const { slug } = useParams()

  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()
  const isOwner = selectedOrganization?.is_owner

  const { data: permissions } = usePermissionsQuery()
  const { data: detailData } = useOrganizationDetailQuery({ slug })
  const { data: rolesData } = useOrganizationRolesQuery({ slug })

  const members = detailData?.members ?? []
  const roles = rolesData?.roles ?? []

  const [isLeaving, setIsLeaving] = useState(false)

  return (
    <ScaffoldContainerLegacy>
      <ScaffoldFilterAndContent>
        <ScaffoldActionsContainer className="justify-between">
          <ScaffoldActionsGroup>
            <div>
              <NewRoleButton parentRoles={roles} />
            </div>
          </ScaffoldActionsGroup>
        </ScaffoldActionsContainer>
        <ScaffoldSectionContent className="w-full">
          <RolesView />
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>
    </ScaffoldContainerLegacy>
  )
}

export default PermissionsSettings
