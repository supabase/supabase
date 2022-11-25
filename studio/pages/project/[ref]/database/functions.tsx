import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { CreateFunction, DeleteFunction } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'
import NoPermission from 'components/ui/NoPermission'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'

const FunctionsPage: NextPageWithLayout = () => {
  const { meta, ui } = useStore()
  const [filterString, setFilterString] = useState<string>('')
  const [selectedFunction, setSelectedFunction] = useState<any>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState<boolean>(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState<boolean>(false)

  const canReadFunctions = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      fetchFunctions()
    }
  }, [ui.selectedProject?.ref])

  const fetchFunctions = async () => {
    meta.functions.load()
  }

  const createFunction = () => {
    setSelectedFunction(undefined)
    setShowCreateFunctionForm(true)
  }

  const editFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowCreateFunctionForm(true)
  }

  const deleteFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowDeleteFunctionForm(true)
  }

  if (!canReadFunctions) {
    return <NoPermission isFullPage resourceText="view database functions" />
  }

  return (
    <>
      <FunctionsList
        filterString={filterString}
        setFilterString={setFilterString}
        createFunction={createFunction}
        editFunction={editFunction}
        deleteFunction={deleteFunction}
      />
      <CreateFunction
        func={selectedFunction}
        visible={showCreateFunctionForm}
        setVisible={setShowCreateFunctionForm}
      />
      <DeleteFunction
        func={selectedFunction}
        visible={showDeleteFunctionForm}
        setVisible={setShowDeleteFunctionForm}
      />
    </>
  )
}

FunctionsPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(FunctionsPage)
