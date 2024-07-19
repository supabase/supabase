import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'
import { Button, IconHelpCircle, Modal } from 'ui'

interface SpendCapModalProps {
  visible: boolean
  onHide: () => void
}

const SpendCapModal = ({ visible, onHide }: SpendCapModalProps) => {
  return (
    <Modal hideFooter visible={visible} size="xlarge" header="Spend cap" onCancel={() => onHide()}>
      <Modal.Content>
        <div className="space-y-4">
          <p className="text-sm">
            Enabling the spend cap sets a limit on your usage to stay within your plan's quota,
            which controls costs but can limit service. Disabling the spend cap removes these
            limits, but any extra usage beyond the plan's limit will be charged per usage.
          </p>
          <p className="text-sm">
            Take a look at the following table to see which resources are chargeable and how they
            are charged:
          </p>
          {/* Maybe instead of a table, show something more interactive like a spend cap playground */}
          {/* Maybe ideate this in Figma first but this is good enough for now */}
          <div className="border rounded border-control bg-overlay-hover">
            <div className="flex items-center px-4 pt-2 pb-1">
              <p className="w-[50%] text-sm text-foreground-light">Item</p>
              <p className="w-[25%] text-sm text-foreground-light">Limit</p>
              <p className="w-[25%] text-sm text-foreground-light">Rate</p>
            </div>
            <div className="py-2">
              <div className="flex items-center px-4 py-1">
                <p className="w-[50%] text-sm">Database size</p>
                <p className="w-[25%] text-sm">8GB</p>
                <p className="w-[25%] text-sm">$0.125 per GB</p>
              </div>
              <div className="flex items-center px-4 py-1">
                <p className="w-[50%] text-sm">Egress</p>
                <p className="w-[25%] text-sm">250GB</p>
                <p className="w-[25%] text-sm">$0.09 per GB</p>
              </div>
            </div>
            <div className="py-2">
              <div className="flex items-center px-4 py-1">
                <div className="flex w-[50%] items-center space-x-2">
                  <p className="text-sm">Auth MAUs</p>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <IconHelpCircle
                        size={16}
                        strokeWidth={1.5}
                        className="transition opacity-50 cursor-pointer hover:opacity-100"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                              'border border-background', //border
                            ].join(' ')}
                          >
                            <span className="text-xs text-foreground">
                              Monthly Active Users: A user that has made an API request in the last
                              month
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
                <p className="w-[25%] text-sm">100,000</p>
                <p className="w-[25%] text-sm">$0.00325 per user</p>
              </div>
              <div className="flex items-center px-4 py-1">
                <div className="flex w-[50%] items-center space-x-2">
                  <p className="text-sm">Single Sign-On (SAML 2.0) MAUs</p>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <IconHelpCircle
                        size={16}
                        strokeWidth={1.5}
                        className="transition opacity-50 cursor-pointer hover:opacity-100"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                              'border border-background', //border
                            ].join(' ')}
                          >
                            <span className="text-xs text-foreground">
                              Single Sign-On Monthly Active Users: A user that has made an API
                              request in the last month
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
                <p className="w-[25%] text-sm">50</p>
                <p className="w-[25%] text-sm">$0.015 per user</p>
              </div>
            </div>

            <div className="py-2">
              <div className="flex items-center px-4 py-1">
                <p className="w-[50%] text-sm">Storage size</p>
                <p className="w-[25%] text-sm">100GB</p>
                <p className="w-[25%] text-sm">$0.021 per GB</p>
              </div>
              <div className="flex items-center px-4 py-1">
                <p className="w-[50%] text-sm">Storage Image Transformations</p>
                <p className="w-[25%] text-sm">100 origin images</p>
                <p className="w-[25%] text-sm">$5 per 1000 origin images</p>
              </div>
            </div>

            <div className="py-2">
              <div className="flex items-center px-4 py-1">
                <p className="w-[50%] text-sm">Realtime concurrent peak connections</p>
                <p className="w-[25%] text-sm">500</p>
                <p className="w-[25%] text-sm">$10 per 1000</p>
              </div>

              <div className="flex items-center px-4 py-1">
                <p className="w-[50%] text-sm">Realtime messages</p>
                <p className="w-[25%] text-sm">5 Million</p>
                <p className="w-[25%] text-sm">$2.50 per Million</p>
              </div>
            </div>

            <div className="py-2">
              <div className="flex items-center px-4 py-1">
                <p className="w-[50%] text-sm">Function invocations</p>
                <p className="w-[25%] text-sm">2 Million</p>
                <p className="w-[25%] text-sm">$2 per Million</p>
              </div>
            </div>
          </div>

          <p className="text-sm">
            See{' '}
            <Link
              href="https://supabase.com/pricing"
              className="text-brand"
              target="_blank"
              rel="noreferrer"
            >
              <span>pricing page</span>
            </Link>{' '}
            for a full overview.
          </p>
        </div>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content>
        <div className="flex items-center gap-2">
          <Button block type="primary" onClick={() => onHide()}>
            Understood
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  )
}

export default SpendCapModal
