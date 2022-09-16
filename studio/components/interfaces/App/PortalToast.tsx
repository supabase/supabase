import dynamic from 'next/dynamic'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { Button, IconX } from '@supabase/ui'

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
          'bg-bg-primary-light dark:bg-bg-primary-dark text-typography-body-strong-light dark:text-typography-body-strong-dark border dark:border-dark',
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
              {message}
              {t.type !== 'loading' && (
                <div className="ml-4">
                  <Button className="!p-1" type="text" onClick={() => toast.dismiss(t.id)}>
                    <IconX size={14} strokeWidth={2} />
                  </Button>
                </div>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  </PortalRootWithNoSSR>
)

export default PortalToast
