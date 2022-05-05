import {
  Button,
  Collapsible,
  Form,
  IconArrowRight,
  IconCheck,
  IconChevronUp,
  IconGlobe,
  IconTrash,
  IconX,
  Input,
  InputNumber,
  Modal,
  Tabs,
  Toggle,
} from '@supabase/ui'
import { AuthLayout } from 'components/layouts'

import { withAuth } from 'hooks'
import { observer } from 'mobx-react-lite'
import React, { useReducer, useState } from 'react'
// import AuthFormSchema from './AuthFormSchema.json'

import { AutoSchemaForm } from 'components/ui/Forms'

const Auth = () => {
  return (
    <AuthLayout title="Auth">
      <div className="p-4">
        <WholeForm />
      </div>
    </AuthLayout>
  )
}

export function WholeForm() {
  return (
    <div style={{ width: '820px' }} className="mx-auto">
      <div>
        <h3 className="text-scale-1200 mb-2 text-2xl">General settings</h3>
        <p className="text-scale-900 text-sm">
          Turn payment methods on and off in one click – no engineering time required.
        </p>
        <p className="text-scale-900 text-sm">
          Use our guide to check which payment methods are compatible with your integration.
        </p>
        <AutoSchemaForm />
      </div>
    </div>
  )
}

export default withAuth(observer(Auth))
