import { Button, Form, Input, Select } from 'ui'
import { useState } from 'react'
import countries from '~/data/Countries.json'
import supabase from '~/lib/supabase'

const INITIAL_VALUES = {
  companyName: '',
  contactFirstName: '',
  contactLastName: '',
  contactEmail: '',
  contactPhone: '',
  companySize: '',
  details: '',
  country: 'US',
}

const validate = (values: any) => {
  const errors: any = {}

  if (!values.companyName) {
    errors.companyName = 'Required'
  }

  if (!values.contactFirstName) {
    errors.contactFirstName = 'Required'
  }

  if (!values.contactLastName) {
    errors.contactLastName = 'Required'
  }

  if (!values.contactEmail) {
    errors.contactEmail = 'Required'
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.contactEmail)) {
    errors.contactEmail = 'Invalid email address'
  }

  return errors
}

const SOC2RequestForm = () => {
  const [error, setError] = useState<string>()
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)

  const handleFormSubmit = async (values: typeof INITIAL_VALUES, { resetForm }: any) => {
    const { error } = await supabase.from('soc2_requests').insert([
      {
        company_name: values.companyName,
        contact_name: `${values.contactFirstName} ${values.contactLastName}`,
        contact_first_name: values.contactFirstName,
        contact_last_name: values.contactLastName,
        contact_email: values.contactEmail,
        contact_phone: values.contactPhone,
        company_size: values.companySize,
        details: values.details,
        country: values.country,
      },
    ])

    if (!error) {
      resetForm()
      setFormSubmitted(true)
    } else {
      setError(error.message)
    }
  }

  return (
    <div>
      {formSubmitted ? (
        <h3 className="h3 text-brand-900 mt-12 text-center">
          Thank you for your submission! A member from the Supabase team will reach out to you
          shortly!
        </h3>
      ) : (
        <>
          <Form initialValues={INITIAL_VALUES} validate={validate} onSubmit={handleFormSubmit}>
            {({ values, isSubmitting }: any) => {
              const selectedCountry = countries.find(
                (country) => country.code === values['country']
              )
              const phonePlaceholder =
                selectedCountry !== undefined ? `+${selectedCountry.phone_code}` : ''

              return (
                <div className="flex flex-col space-y-1">
                  <div>
                    <Input
                      label="Company Name *"
                      id="companyName"
                      name="companyName"
                      layout="vertical"
                      placeholder="Supa Inc."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Input
                        label="Your First Name *"
                        id="contactFirstName"
                        name="contactFirstName"
                        layout="vertical"
                        placeholder="Jane"
                      />
                    </div>

                    <div className="flex-1">
                      <Input
                        label="Your Last Name *"
                        id="contactLastName"
                        name="contactLastName"
                        layout="vertical"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Your Business Email *"
                      id="contactEmail"
                      name="contactEmail"
                      layout="vertical"
                      placeholder="janedoe@example.com"
                    />
                  </div>

                  <div>
                    <Select
                      label="Company Size"
                      id="companySize"
                      name="companySize"
                      layout="vertical"
                    >
                      <Select.Option value="">{'--'}</Select.Option>
                      <Select.Option value="1-10">1-10 Employees</Select.Option>
                      <Select.Option value="11-50">11-50 Employees</Select.Option>
                      <Select.Option value="51-200">51-200 Employees</Select.Option>
                      <Select.Option value="201-500">201-500 Employees</Select.Option>
                      <Select.Option value="501-1000">501-1000 Employees</Select.Option>
                      <Select.Option value="1001-5000">1001-5000 Employees</Select.Option>
                      <Select.Option value="5001+">5001+ Employees</Select.Option>
                    </Select>
                  </div>

                  <div>
                    <Select
                      label="Country / Main Timezone"
                      id="country"
                      name="country"
                      layout="vertical"
                    >
                      {countries.map(({ code, name }) => (
                        <Select.Option key={code} value={code}>
                          {name}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Input
                      label="Your Phone Number"
                      id="contactPhone"
                      name="contactPhone"
                      layout="vertical"
                      placeholder={phonePlaceholder}
                    />
                  </div>

                  <div className="">
                    <Input.TextArea
                      id="details"
                      name="details"
                      label="Additional Details"
                      placeholder="Tell us about your projects, clients, and technology..."
                      rows={10}
                    />
                  </div>

                  <div className="col-span-2 flex w-full flex-row-reverse pt-4">
                    <Button
                      type="primary"
                      size="small"
                      className="text-white"
                      htmlType="submit"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                    >
                      Submit request
                    </Button>
                  </div>
                </div>
              )
            }}
          </Form>
          {error && <p className="text-sm">Error: {error}</p>}
        </>
      )}
    </div>
  )
}

export default SOC2RequestForm
