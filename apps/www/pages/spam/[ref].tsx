import { NextPage } from 'next'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { Button } from 'ui'
import { motion } from 'framer-motion'
import Layout from '~/components/Layouts/Default'
import { CircleAlert, CircleCheck } from 'lucide-react'

const Spam: NextPage = () => {
  const router = useRouter()
  const { ref } = router.query

  const [pageLoaded, setPageLoaded] = useState(false)
  const [formData, setFormData] = useState({ ref })
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    if (!ref) return

    const refPattern = /^[a-zA-Z]{20}$/

    if (!refPattern.test(ref as string)) {
      setSubmissionMessage('Error: That project reference does not look right.')
      setMessageType('error')
    }

    setPageLoaded(true)
  }, [router, ref])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      const response = await fetch(`/api/spam/${formData.ref}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const message = await response.text()

      if (response.ok) {
        setSubmissionMessage(message)
        setMessageType('success')
      } else {
        console.error('Form submission failed:', message)
        setSubmissionMessage('Error: Form submission failed.')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmissionMessage('Error: An unexpected error occurred.')
      setMessageType('error')
    }
  }

  return (
    <>
      <NextSeo title="Supabase | Report Spam" description="Report spam emails." />
      <Layout className="overflow-visible">
        <div className="mx-auto max-w-xl mt-24 ">
          <span className="label">Report spam</span>
          <h2 className="h4 !m-0">Receive an unexpected email from Supabase?</h2>
          <p className="text-foreground-light">Please report it here so we can investigate.</p>

          {submissionMessage ? (
            <div className="mt-8">
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.25, 0, 1],
                  delay: 0.25,
                }}
              >
                {messageType === 'success' ? <CircleCheck /> : <CircleAlert size={14} />}
                {submissionMessage}
              </motion.div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8">
              <input
                hidden
                name="ref"
                value={formData.ref}
                onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                readOnly
              />
              {pageLoaded && (
                <Button htmlType="submit" size="small">
                  Report
                </Button>
              )}
            </form>
          )}
        </div>
      </Layout>
    </>
  )
}

export default Spam
