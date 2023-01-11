import dynamic from 'next/dynamic'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { Button, IconX } from 'ui'

const PortalRootWithNoSSR = dynamic(
  // @ts-ignore
  () => import('@radix-ui/react-portal').then((portal) => portal.Root),
  { ssr: false }
)

const PortalToast = () => (
  // @ts-ignore
  <PortalRootWithNoSSR className="portal--toast" id="toast">
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          'bg-bg-primary-light dark:bg-bg-primary-dark text-typography-body-strong-light dark:text-typography-body-strong-dark border dark:border-dark !max-w-[380px]',
        style: {
          padding: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '0.875rem',
        },
        error: {
          duration: 8000,
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t} style={t.style}>
          {({ icon, message }) => (
            <>
              {icon}
              <div className="flex items-center">
                <div
                  className={`toast-message w-full ${
                    t.type === 'loading' ? 'max-w-[350px]' : 'max-w-[260px]'
                  }`}
                >
                  {message}
                </div>
                {t.type !== 'loading' && (
                  <div className="ml-4">
                    <Button
                      className="!p-1"
                      type="text"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        toast.dismiss(t.id)
                      }}
                    >
                      <IconX size={14} strokeWidth={2} />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  </PortalRootWithNoSSR>
)

export default PortalToast
