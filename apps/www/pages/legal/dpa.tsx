import * as Yup from 'yup'
import Link from 'next/link'
import { useState } from 'react'
import { Button, Form, IconDownload, Input } from 'ui'

import supabase from '~/lib/supabase'
import CTABanner from 'components/CTABanner/index'
import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'

const DPA = () => {
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<string>()
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)

  const INITIAL_VALUES = { email: '' }

  const FormSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
  })

  const handleFormSubmit = async (values: typeof INITIAL_VALUES, { resetForm }: any) => {
    try {
      setError(undefined)
      const { error } = await supabase
        .from('dpa_downloads')
        .insert([{ contact_email: values.email, document: 'dpa' }])

      if (error) throw error

      resetForm()
      setFormSubmitted(true)
      window.open('https://supabase.com/downloads/docs/Supabase+DPA+220503.pdf', '_blank')
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

                <p>You can download our latest DPA document by submitting your email here.</p>

                {formSubmitted ? (
                  <p className="text-brand">
                    Thank you for your submission! A new tab should have opened with the DPA
                    document
                  </p>
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
                          name="email"
                          id="email"
                          required
                          descriptionText="We only keep a record of your email so we can update you when the document has been updated."
                          placeholder="Your email address"
                          error={error}
                          actions={
                            <Button
                              htmlType="submit"
                              type="default"
                              iconRight={<IconDownload />}
                              className="mr-1"
                              loading={isSubmitting}
                            >
                              Download DPA document
                            </Button>
                          }
                        />
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
