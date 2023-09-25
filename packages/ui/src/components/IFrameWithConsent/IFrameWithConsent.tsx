import { useConsentValue } from 'common'
import { IframeHTMLAttributes } from 'react'
import { Button } from 'ui'
import { cn } from '../../lib/utils'

/**
 * Extends iframe with consent wall
 * before letting youtube load content and embed cookies
 */
interface Props extends IframeHTMLAttributes<HTMLIFrameElement> {}

const IFrameWithConsent = (props: Props) => {
  const { hasAccepted, handleConsent } = useConsentValue('yt-consent')

  return (
    <div>
      {hasAccepted ? (
        <iframe {...props} {...(!hasAccepted ? { sandbox: '' } : {})} />
      ) : (
        <div
          className={cn(
            'absolute w-full inset-0 aspect-video flex items-center justify-center flex-col text-center gap-2 p-6 bg-alternative text-sm',
            props.className
          )}
        >
          <p className="text-base m-0 text-strong">Allow YouTube content?</p>
          <p className="max-w-lg m-0 mb-2 text-light">
            We ask for your permission to load content provided by YouTube, Google. Learn more about{' '}
            <a href="https://policies.google.com/privacy?hl=en-GB" className="underline">
              Google's privacy policy
            </a>{' '}
            before accepting.
          </p>
          <Button type="secondary" onClick={() => handleConsent!('true')}>
            I'm ok with it
          </Button>
        </div>
      )}
    </div>
  )
}

export { IFrameWithConsent }
