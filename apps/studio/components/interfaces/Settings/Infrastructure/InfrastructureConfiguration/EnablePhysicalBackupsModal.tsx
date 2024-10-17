import { ExternalLink, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { useEnablePhysicalBackupsMutation } from 'data/database/enable-physical-backups-mutation'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { Region, useReadReplicaSetUpMutation } from 'data/read-replicas/replica-setup-mutation'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import type { AWS_REGIONS_KEYS } from 'shared-data'
import { AWS_REGIONS } from 'shared-data'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { AVAILABLE_REPLICA_REGIONS } from './InstanceConfiguration.constants'

interface EnablePhysicalBackupsModalProps {
  selectedRegion: string
}

// [Joshen] Just FYI while this is not being used, i'm opting to leave this in as this is IMO an ideal UX
// Problem right now is that we can't immediately initiate a new replica request once the physical backups
// flag is flipped to true as RRs still need a physical backup to be completed before setting an RR up
// i.e This UX will immediately show an error when the create replica request is triggered.
export const EnablePhysicalBackupsModal = ({ selectedRegion }: EnablePhysicalBackupsModalProps) => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)

  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  useProjectDetailQuery(
    { ref },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data.is_physical_backups_enabled) {
          setRefetchInterval(false)
          const regionKey = AWS_REGIONS[selectedRegion as AWS_REGIONS_KEYS].code

          if (ref === undefined) return toast.error('Project ref is required')
          if (!regionKey)
            return toast.error('Unable to deploy replica: Unsupported region selected')
          const primary = databases?.find((db) => db.identifier === ref)
          setUpReplica({
            projectRef: ref,
            region: regionKey as Region,
            size: primary?.size ?? 't4g.small',
          })
        }
      },
    }
  )

  const { mutate: enablePhysicalBackups, isLoading: isEnabling } = useEnablePhysicalBackupsMutation(
    {
      onSuccess: () => {
        setEnabling(true)
        setRefetchInterval(5000)
      },
    }
  )

  const { mutate: setUpReplica } = useReadReplicaSetUpMutation({
    onSuccess: () => {
      const region = AVAILABLE_REPLICA_REGIONS.find((r) => r.key === selectedRegion)?.name
      toast.success(`Spinning up new replica in ${region ?? ' Unknown'}...`)
      setOpen(false)
    },
    onError: (error) => {
      setEnabling(false)
      toast.error(`Failed to deploy relica: ${error.message}`)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="primary">Deploy replica</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Physical backups are required to deploy replicas</DialogTitle>
          <DialogDescription>
            They are used under the hood to spin up read replicas for your project
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-2">
          {enabling ? (
            <>
              <div className="flex items-center gap-x-3">
                <Loader2 className="animate-spin" size={16} />
                <p className="text-sm">Enabling physical backups</p>
              </div>
              <Markdown
                content={`Please do not close the browser until this is completed. This will take a few minutes and your read replica will be deployed thereafter.`}
              />
            </>
          ) : (
            <>
              <p className="text-sm">
                Enabling physical backups will take a few minutes, after which your replica will be
                deployed once completed.
              </p>
              <Markdown
                content={`Do note that you will no longer be able to download your [scheduled backups](/projects/${ref}/database/backups/scheduled) once physical backups have been enabled for your project.`}
              />
            </>
          )}
        </DialogSection>
        {!enabling && (
          <DialogFooter>
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/guides/platform/read-replicas#how-are-read-replicas-made"
              >
                Documentation
              </a>
            </Button>
            <Button
              type="primary"
              loading={isEnabling}
              onClick={() => {
                if (ref) enablePhysicalBackups({ ref })
              }}
            >
              Enable physical backups
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
