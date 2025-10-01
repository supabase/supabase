import { useState } from 'react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { EmptyBucketState } from './EmptyBucketState'
import { CreateBucketModal } from './CreateBucketModal'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { Bucket } from 'data/storage/buckets-query'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { Plus, MoreVertical, Edit, Trash2, FolderOpen } from 'lucide-react'
import { StoragePolicies } from './StoragePolicies/StoragePolicies'
import { StorageSettings } from './StorageSettings/StorageSettings'
import { S3Connection } from './StorageSettings/S3Connection'

export const FilesBuckets = () => {
  const { ref } = useParams()
  const router = useRouter()
  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false)

  const { data: buckets = [], isLoading } = useBucketsQuery({ projectRef: ref })

  // Filter for standard buckets (files)
  const filesBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'STANDARD')

  const handleCreateBucket = () => {
    setShowCreateBucketModal(true)
  }

  // Determine which tab is active based on the current path
  const getActiveTab = () => {
    const path = router.asPath
    if (path.includes('/storage/files/settings')) return 'settings'
    if (path.includes('/storage/files/policies')) return 'policies'
    return 'buckets'
  }

  const activeTab = getActiveTab()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div className="space-y-12">
            <StorageSettings />
            <S3Connection />
          </div>
        )
      case 'policies':
        return <StoragePolicies />
      case 'buckets':
      default:
        if (filesBuckets.length === 0) {
          return (
            <>
              <EmptyBucketState bucketType="files" onCreateBucket={handleCreateBucket} />
              <CreateBucketModal
                hideAnalyticsOption={true}
                visible={showCreateBucketModal}
                onOpenChange={setShowCreateBucketModal}
              />
            </>
          )
        }

        return (
          <div className="space-y-12">
            <ScaffoldSection>
              <div className="col-span-12">
                <FormHeader
                  title="Buckets"
                  actions={
                    <Button type="primary" icon={<Plus size={14} />} onClick={handleCreateBucket}>
                      New file bucket
                    </Button>
                  }
                />

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Visibility</TableHead>
                        {/* <TableHead></TableHead> */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filesBuckets.map((bucket) => (
                        <TableRow key={bucket.id}>
                          <TableCell>
                            <p className="text-foreground">{bucket.name}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-foreground-light">
                              {bucket.public ? 'Public' : 'Private'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button type="default" onClick={() => {}}>
                                View files
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="default" className="px-1" icon={<MoreVertical />} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="bottom" align="end" className="w-40">
                                  <DropdownMenuItem
                                    className="flex items-center space-x-2"
                                    onClick={() => {}}
                                  >
                                    <Edit size={12} />
                                    <p>Edit bucket</p>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="flex items-center space-x-2"
                                    onClick={() => {}}
                                  >
                                    <FolderOpen size={12} />
                                    <p>Empty bucket</p>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    className="flex items-center space-x-2"
                                    onClick={() => {}}
                                  >
                                    <Trash2 size={12} />
                                    <p>Delete bucket</p>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </ScaffoldSection>
          </div>
        )
    }
  }

  return (
    <>
      {renderTabContent()}
      <CreateBucketModal
        hideAnalyticsOption={true}
        visible={showCreateBucketModal}
        onOpenChange={setShowCreateBucketModal}
      />
    </>
  )
}
