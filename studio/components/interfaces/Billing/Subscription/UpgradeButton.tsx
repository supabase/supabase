import { FC, useReducer, useState } from 'react'
import { useRouter } from 'next/router'
import { includes, without } from 'lodash'
import { Button, Modal, Input, Divider, Typography, IconCheckCircle } from '@supabase/ui'

import { SubscriptionStats, useStore } from 'hooks'
import { API_URL, DEFAULT_FREE_PROJECTS_LIMIT } from 'lib/constants'
import { getURL } from 'lib/helpers'
import { post } from 'lib/common/fetch'
import { CancellationReasons } from './SubcriptionCancellation.constants'

/**
 * Generates a Stripe Billing Portal link for a project.
 * To be deprecate after native billing is completely rolled out
 *
 * @param {Object}   props.projectRef        Project Ref
 * @param {Boolean}  props.paid              Tier name
 */

interface Props {
  projectRef: string
  paid: boolean
  subscriptionStats: SubscriptionStats
}

const UpgradeButton: FC<Props> = ({ projectRef, paid, subscriptionStats }) => {
  const router = useRouter()
  const { ui, app } = useStore()
  const [loading, setLoading] = useState<boolean>(false)
  const [exitSurveyVisible, setExitSurveyVisible] = useState<boolean>(false)
  const [showFreeProjectLimitWarning, setShowFreeProjectLimitWarning] = useState<boolean>(false)

  const freeProjectsLimit = ui?.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT
  const freeProjectsOwned = subscriptionStats.total_free_projects ?? 0
  const isOrgOwner = ui.selectedOrganization?.is_owner

  /**
   * Get a link and then redirect them
   */
  const redirectToPortal = async () => {
    try {
      setLoading(true)
      let { subscriptionPortal, billingPortal } = await post(`${API_URL}/stripe/portal`, {
        projectRef,
        returnTo: `${getURL()}${router.asPath}`,
      })
      window.location.replace(subscriptionPortal || billingPortal)
      setExitSurveyVisible(false)
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to redirect: ${error.message}` })
    } finally {
      setExitSurveyVisible(false)
      setLoading(false)
    }
  }

  function handleUpgradeButton() {
    if (paid) {
      if (freeProjectsOwned >= DEFAULT_FREE_PROJECTS_LIMIT) {
        setShowFreeProjectLimitWarning(true)
      } else {
        setExitSurveyVisible(true)
      }
    } else {
      redirectToPortal()
    }
  }

  return (
    <>
      <UnsubcribeExitSurvey
        visible={exitSurveyVisible}
        setVisible={setExitSurveyVisible}
        handleDowngrade={redirectToPortal}
      />
      <Modal
        closable
        visible={showFreeProjectLimitWarning}
        onCancel={() => setShowFreeProjectLimitWarning(false)}
        header="Free project limit reached"
        description="Please delete one of your free projects to downgrade this project back to free tier"
        size="tiny"
        showIcon
        layout="vertical"
        customFooter={
          <div className="flex w-full items-end">
            <Button
              block
              icon={<IconCheckCircle strokeWidth={2} />}
              onClick={() => setShowFreeProjectLimitWarning(false)}
            >
              OK
            </Button>
          </div>
        }
      >
        <Modal.Content>
          <p className="text-sm text-scale-1100 py-4">
            Please delete one of your free projects to downgrade this project back to free tier
          </p>
        </Modal.Content>
      </Modal>
      <div className="flex flex-col items-end space-y-2">
        <Button
          disabled={!isOrgOwner}
          onClick={handleUpgradeButton}
          type={paid ? 'secondary' : 'primary'}
          loading={loading}
        >
          {paid ? 'Cancel subscription' : 'Upgrade to Pro'}
        </Button>
        {!isOrgOwner && (
          <Typography.Text type="secondary" small>
            Only the organization owner can amend subscriptions
          </Typography.Text>
        )}
      </div>
    </>
  )
}

export default UpgradeButton

function UnsubcribeExitSurvey({ visible, setVisible, handleDowngrade }: any) {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()

  const [loading, setLoading] = useState<boolean>(false)
  const [additionalFeedback, setAdditionalFeedback] = useState('')

  const [selectedCancellationReasons, dispatchSelectedCancellationReasons] = useReducer(reducer, [])

  const sendExitSurvey = async () => {
    try {
      const message = `
        # Exit survey\n\n\n
        
        **Reasons for leaving:**\n
        ${selectedCancellationReasons.map((x) => {
          return `${x}. \n`
        })}

        \n
        Additonal feedback:\n
        ${additionalFeedback}
        
      `

      setLoading(true)
      await post(`${API_URL}/feedback/send`, {
        projectRef: ref,
        subject: 'Subscription cancellation - Exit survey',
        tags: ['dashboard-exitsurvey'],
        category: 'Billing',
        message,
      })
      setLoading(false)
      await handleDowngrade()
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to submit exit survey: ${error}` })
    }
  }

  return (
    <Modal
      header="Reason for cancelling"
      loading={loading}
      visible={visible}
      closable
      contentStyle={{ padding: 0 }}
      hideFooter
      onCancel={() => setVisible(false)}
    >
      <div className="py-4 space-y-4">
        <Modal.Content>
          <div className="">
            <div>
              <p className="text-base text-scale-1200">
                <p>We always strive to improve Supabase as much as we can.</p>
              </p>
              <p className="text-sm text-scale-1100">
                <p>
                  please let us know the reasons you are cancelling your subscription so we can
                  improve in the future.
                </p>
              </p>
            </div>
          </div>
        </Modal.Content>
        <Modal.Seperator />
        <Modal.Content>
          <div className="flex flex-wrap gap-2" data-toggle="buttons">
            {CancellationReasons.map((option) => {
              const active = selectedCancellationReasons.find((x) => x === option)
              return (
                <label
                  key={option}
                  className={`
                    checkbox-pill text-center rounded-md py-1 pl-2 pr-3 shadow-sm 
                    transition-all flex items-center space-x-2
                    duration-100 cursor-pointer text-sm
                    ${
                      active
                        ? ` opacity-100 bg-white text-scale-100 hover:bg-opacity-75`
                        : ` bg-scale-1200 opacity-25 hover:opacity-50 text-scale-100`
                    }
                `}
                >
                  <input
                    type="checkbox"
                    name="options"
                    value={option}
                    className="hidden"
                    onClick={dispatchSelectedCancellationReasons}
                  />
                  <div>{option}</div>
                </label>
              )
            })}
          </div>
        </Modal.Content>
        <Modal.Seperator />
        <Modal.Content>
          <Input.TextArea
            id="feedback"
            onChange={(e) => setAdditionalFeedback(e.target.value)}
            value={additionalFeedback}
            label="Anything else we can improve on?"
            placeholder="Anything else we should know, or could improve on?"
          />
        </Modal.Content>
        <Modal.Seperator />
        <div className="flex gap-2 justify-end px-6 w-full">
          <Button type="default" onClick={() => setVisible(false)}>
            Cancel
          </Button>
          <Button loading={loading} onClick={sendExitSurvey}>
            Proceed to cancel subscription
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function reducer(state: any, action: any) {
  if (includes(state, action.target.value)) {
    return without(state, action.target.value)
  } else {
    return [...state, action.target.value]
  }
}
