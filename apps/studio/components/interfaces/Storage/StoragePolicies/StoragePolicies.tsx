import { PostgresPolicy } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { isEmpty } from 'lodash'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PolicyEditorModal from 'components/interfaces/Auth/Policies/PolicyEditorModal'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyCreateMutation } from 'data/database-policies/database-policy-create-mutation'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useDatabasePolicyUpdateMutation } from 'data/database-policies/database-policy-update-mutation'
import { usePaginatedBucketsQuery } from 'data/storage/buckets-query'
import { useDebouncedValue } from 'hooks/misc/useDebouncedValue'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { formatPoliciesForStorage, UNGROUPED_POLICY_SYMBOL } from '../Storage.utils'
import { StoragePoliciesBucketRow } from './StoragePoliciesBucketRow'
import { BucketsPolicies, type SelectBucketPolicyForAction } from './StoragePoliciesBucketsSection'
import StoragePoliciesEditPolicyModal from './StoragePoliciesEditPolicyModal'

export const StoragePolicies = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy>()
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<PostgresPolicy>()
  const [isEditingPolicyForBucket, setIsEditingPolicyForBucket] = useState<{
    bucket: string
    table: string
  }>()
  const [searchString, setSearchString] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ history: 'replace', clearOnDefault: true })
  )
  const debouncedSearchString = useDebouncedValue(searchString, 250)

  const {
    data: bucketsData,
    isPending: isLoadingBuckets,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePaginatedBucketsQuery({
    projectRef,
    search: debouncedSearchString || undefined,
  })
  const buckets = useMemo(() => bucketsData?.pages.flatMap((page) => page) ?? [], [bucketsData])

  const {
    data: policies = [],
    refetch,
    isPending: isLoadingPolicies,
  } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })

  const isLoading = isLoadingBuckets || isLoadingPolicies

  const { mutateAsync: createDatabasePolicy } = useDatabasePolicyCreateMutation({
    onError: () => {},
  })
  const { mutateAsync: updateDatabasePolicy } = useDatabasePolicyUpdateMutation()
  const { mutate: deleteDatabasePolicy, isPending: isDeletingPolicy } =
    useDatabasePolicyDeleteMutation({
      onSuccess: async () => {
        await refetch()
        toast.success('Successfully deleted policy!')
        setSelectedPolicyToDelete(undefined)
      },
      onError: (error: any) => {
        toast.error(`Failed to delete policy: ${error.message}`)
      },
    })

  // Only use storage policy editor when creating new policies for buckets
  const showStoragePolicyEditor =
    isEmpty(selectedPolicyToEdit) &&
    !isEmpty(isEditingPolicyForBucket) &&
    (isEditingPolicyForBucket.bucket ?? '').length > 0

  const showGeneralPolicyEditor = !isEmpty(isEditingPolicyForBucket) && !showStoragePolicyEditor

  // Policies under storage.buckets
  const storageBucketPolicies = policies.filter(
    (x) => x.schema === 'storage' && x.table === 'buckets'
  )
  // Policies under storage.objects
  const storageObjectsPolicies = policies.filter(
    (x) => x.schema === 'storage' && x.table === 'objects'
  )

  const formattedStorageObjectPolicies = useMemo(
    () => formatPoliciesForStorage(buckets, storageObjectsPolicies),
    [buckets, storageObjectsPolicies]
  )

  const ungroupedPolicies =
    formattedStorageObjectPolicies.find((x) => x.name === UNGROUPED_POLICY_SYMBOL)?.policies ?? []

  const bucketsWithPolicies = useMemo(() => {
    // Get policies for filtered buckets (show all policies, don't filter them)
    // Show all filtered buckets, even if they don't have policies
    return buckets.map((bucket) => {
      const bucketPolicies =
        formattedStorageObjectPolicies.find((x) => x.name === bucket.name)?.policies ?? []
      return { bucket, policies: bucketPolicies }
    })
  }, [buckets, formattedStorageObjectPolicies])

  const onSelectPolicyAdd: SelectBucketPolicyForAction['addPolicy'] = (
    bucketName = '',
    table = ''
  ) => {
    setSelectedPolicyToEdit(undefined)
    setIsEditingPolicyForBucket({ bucket: bucketName, table })
  }

  const onSelectPolicyEdit: SelectBucketPolicyForAction['editPolicy'] = (
    policy,
    bucketName = '',
    table = ''
  ) => {
    setIsEditingPolicyForBucket({ bucket: bucketName, table })
    setSelectedPolicyToEdit(policy)
  }

  const onCancelPolicyEdit = () => {
    setIsEditingPolicyForBucket(undefined)
  }

  const onSelectPolicyDelete: SelectBucketPolicyForAction['deletePolicy'] = (policy: any) =>
    setSelectedPolicyToDelete(policy)
  const onCancelPolicyDelete = () => setSelectedPolicyToDelete(undefined)

  const onSavePolicySuccess = async () => {
    toast.success('Successfully saved policy!')
    await refetch()
    onCancelPolicyEdit()
  }

  /*
    Functions that involve the CRUD for policies
    For each API call within the Promise.all, return true if an error occurred, else return false
  */
  const onCreatePolicies = async (payloads: any[]) => {
    if (!project) {
      console.error('Project is required')
      return true
    }

    try {
      return await Promise.all(
        payloads.map(async (payload) => {
          try {
            await createDatabasePolicy({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              payload,
            })
            return false
          } catch (error: any) {
            toast.error(`Error adding policy: ${error.message}`)
            return true
          }
        })
      )
    } finally {
    }
  }

  const onCreatePolicy = async (payload: any) => {
    if (!project) {
      console.error('Project is required')
      return true
    }

    try {
      await createDatabasePolicy({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        payload,
      })
      return false
    } catch (error: any) {
      toast.error(`Error adding policy: ${error.message}`)
      return true
    }
  }

  const onUpdatePolicy = async (payload: any) => {
    if (!project) {
      console.error('Project is required')
      return true
    }
    if (!selectedPolicyToEdit) {
      console.error('Unable to find policy')
      return true
    }

    try {
      await updateDatabasePolicy({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        originalPolicy: selectedPolicyToEdit,
        payload,
      })
      return false
    } catch (error: any) {
      toast.error(`Error updating policy: ${error.message}`)
      return true
    }
  }

  const onDeletePolicy = async () => {
    if (!project) return console.error('Project is required')
    if (!selectedPolicyToDelete) return console.error('Unable to find policy')

    deleteDatabasePolicy({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      originalPolicy: selectedPolicyToDelete,
    })
  }

  return (
    <>
      <PageContainer>
        {isLoading ? (
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        ) : (
          <div>
            <BucketsPolicies
              buckets={bucketsWithPolicies}
              search={searchString}
              debouncedSearch={debouncedSearchString}
              setSearch={setSearchString}
              actions={{
                addPolicy: onSelectPolicyAdd,
                editPolicy: onSelectPolicyEdit,
                deletePolicy: onSelectPolicyDelete,
              }}
              pagination={{
                hasNextPage,
                isFetchingNextPage,
                fetchNextPage,
              }}
            />

            <PageSection>
              <PageSectionMeta>
                <PageSectionSummary>
                  <PageSectionTitle>Schema</PageSectionTitle>
                  <PageSectionDescription>
                    Write policies for the tables under the storage schema directly for greater
                    control
                  </PageSectionDescription>
                </PageSectionSummary>
              </PageSectionMeta>
              <PageSectionContent>
                <div className="flex flex-col gap-y-4">
                  {/* Section for policies under storage.objects that are not tied to any buckets */}
                  <StoragePoliciesBucketRow
                    table="objects"
                    label="Other policies under storage.objects"
                    policies={ungroupedPolicies}
                    onSelectPolicyAdd={onSelectPolicyAdd}
                    onSelectPolicyEdit={onSelectPolicyEdit}
                    onSelectPolicyDelete={onSelectPolicyDelete}
                  />

                  {/* Section for policies under storage.buckets */}
                  <StoragePoliciesBucketRow
                    table="buckets"
                    label="Policies under storage.buckets"
                    policies={storageBucketPolicies}
                    onSelectPolicyAdd={onSelectPolicyAdd}
                    onSelectPolicyEdit={onSelectPolicyEdit}
                    onSelectPolicyDelete={onSelectPolicyDelete}
                  />
                </div>
              </PageSectionContent>
            </PageSection>
          </div>
        )}
      </PageContainer>

      {/* Only used for adding policies to buckets */}
      <StoragePoliciesEditPolicyModal
        visible={showStoragePolicyEditor}
        bucketName={isEditingPolicyForBucket?.bucket}
        onSelectCancel={onCancelPolicyEdit}
        onCreatePolicies={onCreatePolicies}
        onSaveSuccess={onSavePolicySuccess}
      />

      {/* Adding policies to objets/buckets table or editting any policy uses the general policy editor */}
      <PolicyEditorModal
        schema="storage"
        visible={showGeneralPolicyEditor}
        table={isEditingPolicyForBucket?.table ?? ''}
        selectedPolicyToEdit={selectedPolicyToEdit}
        onSelectCancel={onCancelPolicyEdit}
        onCreatePolicy={onCreatePolicy}
        onUpdatePolicy={onUpdatePolicy}
        onSaveSuccess={onSavePolicySuccess}
      />

      <ConfirmationModal
        visible={!isEmpty(selectedPolicyToDelete)}
        variant="destructive"
        title="Delete policy"
        description={`Are you sure you want to delete the policy “${selectedPolicyToDelete?.name}”? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        loading={isDeletingPolicy}
        onCancel={onCancelPolicyDelete}
        onConfirm={onDeletePolicy}
      />
    </>
  )
}
