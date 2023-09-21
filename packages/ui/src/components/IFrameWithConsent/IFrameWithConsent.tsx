import { useConsentValue } from 'common'
import { IframeHTMLAttributes } from 'react'
import { Button } from '../Button'
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
            'z-10 w-full inset-0 flex items-center justify-center flex-col text-center gap-2 p-6 bg-alternative text-sm',
            props.className
          )}
        >
          <p className="text-base">Allow YouTube content?</p>
          <p className="max-w-lg mb-2 text-light">
            We ask for your permission to load content provided by YouTube (Google) and other
            third-party services that may come along with it. You may read more about{' '}
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
