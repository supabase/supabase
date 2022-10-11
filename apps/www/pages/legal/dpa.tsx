import { Button, Form, IconDownload, Input } from 'ui'
import CTABanner from 'components/CTABanner/index'
import { useState } from 'react'
import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import supabase from '~/lib/supabase'
import * as Yup from 'yup'

const DPA = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [formSubmitted, setFormSubmitted] = useState(false)

  const INITIAL_VALUES = {
    email: '',
  }

  const FormSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
  })

  const handleFormSubmit = async (values: typeof INITIAL_VALUES, { resetForm }: any) => {
    console.log('handleFormSubmit ran')
    try {
      setError('')

      const { error } = await supabase.from('enterprise_contacts').insert([
        {
          contact_email: values.email,
          doucment: 'dpa',
        },
      ])

      if (error) throw error

      resetForm()
      setFormSubmitted(true)
      setMessage('A new tab should have opened with the DPA document')

      window.open('https://supabase.com/downloads/docs/legal/dpa.pdf', '_blank')
    } catch (error: any) {
      setError(error.message)
    }
  }
  return (
    <>
      <Layout>
        <SectionContainer>
          <div className="mx-auto grid max-w-2xl grid-cols-12 rounded-lg">
            <div className="col-span-12 flex items-center lg:col-span-12">
              <div className="prose flex flex-col space-y-8 p-16">
                <h1 className="text-center text-5xl">DPA</h1>
                <p>
                  We have a long-standing commitment to customer privacy and data protection, and as
                  part of that commitment we have prepared a pre-signed Data Processing Addendum
                  ("DPA").
                </p>

                <p>You can download the latest DPA document through our security portal.</p>

                {message ? (
                  <p className="text-brand-900">{message}</p>
                ) : (
                  <Form
                    initialValues={INITIAL_VALUES}
                    validationSchema={FormSchema}
                    onSubmit={handleFormSubmit}
                  >
                    {({ isSubmitting }: any) => (
                      <>
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          required
                          descriptionText="We only keep a record of your email so we can update you when the document has been updated."
                          placeholder="Your email address"
                          error={error}
                          actions={
                            <Button
                              htmlType="submit"
                              type="default"
                              iconRight={<IconDownload />}
                              loading={isSubmitting}
                            >
                              Download DPA document
                            </Button>
                          }
                        />
                        {formSubmitted && <p>A new tab should have opened with the DPA document</p>}
                        {error && <p>{error}</p>}
                      </>
                    )}
                  </Form>
                )}
              </div>
            </div>
          </div>
        </SectionContainer>
        <CTABanner />
      </Layout>
    </>
  )
}
export default DPA
