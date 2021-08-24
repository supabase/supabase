import DashboardLayout from '../../components/layouts/DashboardLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchOpenApiSpec } from '../../lib/api'
import { ReactElement, useState, Children, cloneElement } from 'react'
import React from 'react'
import { Input, Modal, Toggle, Alert } from '@supabase/ui'
import { StorageContext } from '../../context/StorageContext'

export default function StorageLayout({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) {
  //TODO: get storage buckets
  const bucketNames: string[] = []

  const [modalVisible, setModalVisible] = useState(false)
  const [bucketPublic, setBucketPublic] = useState(false)

  const toggleModalVisible = () => {
    setModalVisible(!modalVisible)
  }

  const toggleBucketPublic = () => {
    setBucketPublic(!bucketPublic)
  }

  const buildSidebar = (bucketNames: string[]) => {
    return [
      {
        label: 'All Buckets',
        links: bucketNames.map((name) => ({ label: name, href: `/storage/buckets/${name}` })),
      },
      {
        label: 'Settings',
        links: [
          { label: 'Policies', href: '/storage/policies' },
          { label: 'Usage', href: '/storage/usage' },
        ],
      },
    ]
  }

  const buildSidebarButton = () => {
    return {
      label: 'New bucket',
      action: (_e: any) => setModalVisible(true),
    }
  }

  return (
    <DashboardLayout
      title={title || 'Storage'}
      sidebar={{
        title: 'Storage',
        categories: buildSidebar(bucketNames),
        searchable: true,
        button: buildSidebarButton(),
      }}
    >
      <>
        <Modal title="Create new bucket" visible={modalVisible} onCancel={toggleModalVisible}>
          <Input
            label="Name of bucket"
            labelOptional="Buckets cannot be renamed once created"
            layout="horizontal"
            placeholder="e.g. new-bucket"
            descriptionText="Only lowercase letters, numbers, dots (.) and hyphens (-)"
            className="w-full"
          />
          <Toggle
            className="mt-8 w-full"
            label="Make bucket public"
            checked={bucketPublic}
            onChange={toggleBucketPublic}
            align="right"
          />
          {bucketPublic && (
            <Alert variant="warning" title="Warning: Public bucket" withIcon>
              Users can read objects in public buckets without any authorization. RLS policies are
              still required other operations such as object uploads and deletes.
            </Alert>
          )}
        </Modal>
        <StorageContext.Provider value={{ openBucketModal: (_e: any) => setModalVisible(true) }}>
          {children}
        </StorageContext.Provider>
      </>
    </DashboardLayout>
  )
}
