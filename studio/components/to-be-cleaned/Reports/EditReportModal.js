import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'

import { Input, Modal } from '@supabase/ui'

import { useProjectContentStore } from 'stores/projectContentStore'
import { toast } from 'react-hot-toast'

const EditModal = () => {
  const router = useRouter()
  const { id, ref } = router.query

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(null)
  const [description, setDescription] = useState(null)

  const contentStore = useProjectContentStore(ref)

  /*
   * fetchReport()
   *
   * Fetches the report and sets the Name and description
   *
   * toJS() is used to deepcopy mobx to js
   */
  const fetchReport = async () => {
    setLoading(true)
    await contentStore.load()
    let reportData = contentStore.byId(id)

    setName(toJS(reportData?.name))
    setDescription(toJS(reportData?.description))

    setLoading(false)
    return reportData
  }

  useEffect(() => {
    fetchReport()
    setVisible(false)
  }, [])

  async function handleSubmit() {
    try {
      setLoading(true)
      const { data, error } = await contentStore.update(id, {
        name,
        description,
      })
      if (error) throw error
      setLoading(false)
      await contentStore.load()
      setVisible(!visible)
      return data
    } catch (error) {
      console.error(error)
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Edit report"
      visible={visible}
      onCancel={() => setVisible(false)}
      size="medium"
      onConfirm={handleSubmit}
      loading={loading}
    >
      <div className="w-full space-y-4">
        <Input
          layout="horizontal"
          label="Name"
          descriptionText="Name cannot be longer than 128 char"
          value={name}
          onChange={(e) => setName(e.target.value)}
        >
          Name
        </Input>
        <Input
          layout="horizontal"
          label="Description"
          descriptionText="description cannot be longer than 256 char"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        >
          Description
        </Input>
      </div>
    </Modal>
  )
}

export default observer(EditModal)
