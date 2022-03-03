import { FC } from 'react'
import { Transition } from '@headlessui/react'
import { Button, Form, Input, IconArrowLeft } from '@supabase/ui'

interface Props {
  visible: boolean
  onSelectBack: () => void
}

const EnterpriseRequest: FC<Props> = ({ visible, onSelectBack }) => {
  const initialValues = {
    name: '',
    email: '',
    company: '',
    message: '',
  }

  return (
    <Transition
      show={visible}
      enter="transition ease-out duration-300"
      enterFrom="transform opacity-0 translate-x-10"
      enterTo="transform opacity-100 translate-x-0"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100"
      leaveTo="transform opacity-0 -translate-x-10"
    >
      <div className="space-y-8">
        <div className="relative">
          <div className="absolute top-[2px] -left-24">
            <Button type="text" icon={<IconArrowLeft />} onClick={onSelectBack}>
              Back
            </Button>
          </div>
          <div className="space-y-1">
            <h4 className="text-xl">Customised plans tailored for your business needs</h4>
            <p className="text-scale-1100">
              Let us know a few details and we’ll be in contact with you!
            </p>
          </div>
          <Form
            validateOnBlur
            initialValues={initialValues}
            onSubmit={async (values: any, { setSubmitting }: any) => {}}
            validate={(values) => {}}
          >
            {({ isSubmitting }: { isSubmitting: boolean }) => (
              <div className="space-y-4 py-3">
                <Input layout="horizontal" label="Name" id="name" name="name" />
                <Input layout="horizontal" label="Email" id="email" name="email" />
                <Input layout="horizontal" label="Company" id="company" name="company" />
                <Input.TextArea
                  label="Let us know what you intend to use Supabase for"
                  id="message"
                  name="message"
                />
              </div>
            )}
          </Form>
        </div>
      </div>
    </Transition>
  )
}

export default EnterpriseRequest
