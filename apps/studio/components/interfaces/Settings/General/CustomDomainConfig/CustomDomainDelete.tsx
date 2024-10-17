import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import Panel from 'components/ui/Panel'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import type { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { Button } from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
import { ExternalLink, Trash } from 'lucide-react'

export type CustomDomainDeleteProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
}

const CustomDomainDelete = ({ projectRef, customDomain }: CustomDomainDeleteProps) => {
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false)
  const { mutate: deleteCustomDomain } = useCustomDomainDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted custom domain`)
      setIsDeleteConfirmModalVisible(false)
    },
  })

  const onDeleteCustomDomain = async () => {
    if (!projectRef) return console.error('Project ref is required')
    deleteCustomDomain({ projectRef })
  }

  return (
    <>
      <Panel.Content>
        <div className="w-full space-y-2">
          <p className="text-xs text-foreground-light">Active custom domain:</p>
          <div className="flex items-center space-x-2">
            <code className="text-lg mx-0 flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-brand" />
              <span>{customDomain.hostname}</span>
            </code>
          </div>
          <p className="text-sm text-foreground-light">
            Your custom domain is currently active and is serving traffic
          </p>
        </div>
      </Panel.Content>

      <div className="w-full border-t border-muted" />

      <Panel.Content className="w-full">
        <div className="flex items-center justify-between">
          <Button asChild type="default" icon={<ExternalLink />}>
            <Link
              href="https://supabase.com/docs/guides/platform/custom-domains"
              target="_blank"
              rel="noreferrer"
            >
              Documentation
            </Link>
          </Button>
          <Button
            type="danger"
            icon={<Trash />}
            onClick={() => setIsDeleteConfirmModalVisible(true)}
          >
            Delete Custom Domain
          </Button>
        </div>
      </Panel.Content>

      <ConfirmModal
        danger
        visible={isDeleteConfirmModalVisible}
        // @ts-ignore
        title={
          <div>
            Are you sure you want to delete the custom domain{' '}
            <code className="text-sm">{customDomain.hostname}</code> for the project?
          </div>
        }
        description="Your custom domain will be deactivated. You will need to re-verify your domain if you want to use it again."
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setIsDeleteConfirmModalVisible(false)}
        onSelectConfirm={onDeleteCustomDomain}
      />
    </>
  )
}

export default CustomDomainDelete
