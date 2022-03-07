import { FC } from 'react'
import { Transition } from '@headlessui/react'
import { Button, Form, Input, IconArrowLeft } from '@supabase/ui'
import { useStore } from 'hooks'
import { timeout } from 'lib/helpers'

interface Props {
  onSelectBack: () => void
}

const EnterpriseRequest: FC<Props> = ({ onSelectBack }) => {
  const { ui } = useStore()
  const { profile } = ui

  const initialValues = {
    name: `${profile?.first_name} ${profile?.last_name}`,
    email: profile?.primary_email,
    company: '',
    message: '',
  }

  const onValidate = (values: any) => {
    console.log('onValidate', values)
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    await timeout(1000)
    console.log('onSubmit', values)
    setSubmitting(false)
  }

  return (
    <Transition
      show
      appear
      enter="transition ease-out duration-300"
      enterFrom="transform opacity-0 translate-x-10"
      enterTo="transform opacity-100 translate-x-0"
    >
      <div className="space-y-8 w-4/5">
        <div className="relative">
          <div className="absolute top-[2px] -left-24">
            <Button type="text" icon={<IconArrowLeft />} onClick={onSelectBack}>
              Back
            </Button>
          </div>
          <div className="space-y-1">
            <h4 className="text-lg">Customised plans tailored for your business needs</h4>
            <p className="text-scale-1100">
              Let us know a few details and we’ll be in contact with you!
            </p>
          </div>
          <Form
            validateOnBlur
            initialValues={initialValues}
            validate={onValidate}
            onSubmit={onSubmit}
          >
            {({ isSubmitting }: { isSubmitting: boolean }) => (
              <div className="space-y-12 py-16">
                <div className="space-y-4 w-3/5">
                  <Input layout="horizontal" label="Name" id="name" name="name" />
                  <Input layout="horizontal" label="Email" id="email" name="email" />
                  <Input layout="horizontal" label="Company" id="company" name="company" />
                </div>
                <Input.TextArea
                  id="message"
                  name="message"
                  label="Let us know what you intend to use Supabase for"
                />
                <Button htmlType="submit" loading={isSubmitting}>
                  Submit request
                </Button>
              </div>
            )}
          </Form>
        </div>
      </div>
    </Transition>
  )
}

export default EnterpriseRequest
