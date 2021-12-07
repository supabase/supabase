import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Typography } from '@supabase/ui'
import { find, get, isEmpty, filter } from 'lodash'

import { useStore } from 'hooks'
import { formatPoliciesForStorage } from '../Storage.utils'
import StoragePoliciesPlaceholder from './StoragePoliciesPlaceholder'
import StoragePoliciesBucketRow from './StoragePoliciesBucketRow'
import StoragePoliciesEditPolicyModal from './StoragePoliciesEditPolicyModal'
import ConfirmModal from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModalV2'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

import PolicyEditorModal from 'components/to-be-cleaned/Auth/PolicyEditorModal'

const StoragePolicies = () => {
  const { ui, meta } = useStore()
  const storageStore = useStorageStore()
  const { buckets } = storageStore

  const [policies, setPolicies] = useState([])
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState({})
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState({})
  const [isEditingPolicyForBucket, setIsEditingPolicyForBucket] = useState({})

  // Only use storage policy editor when creating new policies for buckets
  const showStoragePolicyEditor =
    isEmpty(selectedPolicyToEdit) &&
    !isEmpty(isEditingPolicyForBucket) &&
    get(isEditingPolicyForBucket, ['bucket'], '').length > 0

  const showGeneralPolicyEditor = !isEmpty(isEditingPolicyForBucket) && !showStoragePolicyEditor

  // Policies under storage.objects
  const storageObjectsPolicies = filter(policies, { table: 'objects' })
  const formattedStorageObjectPolicies = formatPoliciesForStorage(storageObjectsPolicies)
  const ungroupedPolicies = get(
    find(formattedStorageObjectPolicies, { name: 'Ungrouped' }),
    ['policies'],
    []
  )

  // Policies under storage.buckets
  const storageBucketPolicies = filter(policies, { table: 'buckets' })

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    if (meta) {
      await meta.policies.load()
      const storagePolicies =
        meta?.policies.list((policy) => policy.schema === 'storage', {
          allSchemas: true,
        }) ?? []
      setPolicies(storagePolicies)
    }
  }

  const onSelectPolicyAdd = (bucketName = '', table = '') => {
    setSelectedPolicyToEdit({})
    setIsEditingPolicyForBucket({ bucket: bucketName, table })
  }

  const onSelectPolicyEdit = (policy, bucketName = '', table = '') => {
    setIsEditingPolicyForBucket({ bucket: bucketName, table })
    setSelectedPolicyToEdit(policy)
  }

  const onCancelPolicyEdit = () => {
    setIsEditingPolicyForBucket({})
  }

  const onSelectPolicyDelete = (policy) => setSelectedPolicyToDelete(policy)
  const onCancelPolicyDelete = () => setSelectedPolicyToDelete({})

  const onSavePolicySuccess = async () => {
    ui.setNotification({ category: 'success', message: 'Successfully saved policy!' })
    await fetchPolicies()
    onCancelPolicyEdit()
  }

  /*
    Functions that involve the CRUD for policies
    For each API call within the Promise.all, return true if an error occured, else return false
  */
  const onCreatePolicies = async (payloads) => {
    return await Promise.all(
      payloads.map(async (payload) => {
        const res = await meta.policies.create(payload)
        if (res.error) {
          ui.setNotification({
            category: 'error',
            message: `Error adding policy: ${res.error.message}`,
          })
          return true
        }
        return false
      })
    )
  }

  const onCreatePolicy = async (payload) => {
    const res = await meta.policies.create(payload)
    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Error adding policy: ${res.error.message}`,
      })
      return true
    }
    return false
  }

  const onUpdatePolicy = async (payload) => {
    const res = await meta.policies.update(payload.id, payload)
    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Error updating policy: ${res.error.message}`,
      })
      return true
    }
    return false
  }

  const onDeletePolicy = async () => {
    const res = await meta.policies.del(selectedPolicyToDelete.id)
    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete policy: ${res.error.message}`,
      })
    } else {
      ui.setNotification({ category: 'success', message: 'Successfully deleted policy!' })
    }
    setSelectedPolicyToDelete({})
    await fetchPolicies()
  }

  return (
    <div className="flex flex-col w-full min-h-full">
      <Typography.Title level={4} className="mb-0">
        Storage policies
      </Typography.Title>
      <Typography.Text className="opacity-50">
        Safeguard your files with policies that define the operations allowed for your users at the
        bucket level.
      </Typography.Text>

      <div className="space-y-4 mt-4">
        {buckets.length === 0 && <StoragePoliciesPlaceholder />}

        {/* Sections for policies grouped by buckets */}
        {buckets.map((bucket) => {
          const bucketPolicies = get(
            find(formattedStorageObjectPolicies, { name: bucket.name }),
            ['policies'],
            []
          )
          return (
            <StoragePoliciesBucketRow
              key={bucket.name}
              table="objects"
              label={bucket.name}
              bucket={bucket}
              policies={bucketPolicies}
              onSelectPolicyAdd={onSelectPolicyAdd}
              onSelectPolicyEdit={onSelectPolicyEdit}
              onSelectPolicyDelete={onSelectPolicyDelete}
            />
          )
        })}

        <div className="w-full border-b border-gray-600 !mb-4" />
        <Typography.Text className="opacity-50">
          You may also write policies for the tables under the storage schema directly for greater
          control
        </Typography.Text>

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

      {/* Only used for adding policies to buckets */}
      <StoragePoliciesEditPolicyModal
        visible={showStoragePolicyEditor}
        bucketName={isEditingPolicyForBucket.bucket}
        onSelectCancel={onCancelPolicyEdit}
        onCreatePolicies={onCreatePolicies}
        onSaveSuccess={onSavePolicySuccess}
      />

      {/* Adding policies to objets/buckets table or editting any policy uses the general policy editor */}
      <PolicyEditorModal
        visible={showGeneralPolicyEditor}
        schema="storage"
        table={isEditingPolicyForBucket.table}
        target={isEditingPolicyForBucket.bucket}
        selectedPolicyToEdit={selectedPolicyToEdit}
        onSelectCancel={onCancelPolicyEdit}
        onCreatePolicy={onCreatePolicy}
        onUpdatePolicy={onUpdatePolicy}
        onSaveSuccess={onSavePolicySuccess}
      />

      <ConfirmModal
        danger
        visible={!isEmpty(selectedPolicyToDelete)}
        title="Confirm to delete policy"
        description={`This is permanent! Are you sure you want to delete the policy "${selectedPolicyToDelete.name}"`}
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        selectedPolicyToDelete={selectedPolicyToDelete}
        onSelectCancel={onCancelPolicyDelete}
        onSelectConfirm={onDeletePolicy}
      />
    </div>
  )
}

export default observer(StoragePolicies)
