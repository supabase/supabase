import { useTranslation } from './LocaleProvider'
import type { MessageKey } from './messages/en'
import { resolveMessage, type MessageParams } from './translate'

export const TranslatedText = ({
  messageKey,
  params,
}: {
  messageKey: MessageKey
  params?: MessageParams
}) => {
  const { locale } = useTranslation()
  const { text, lang } = resolveMessage(locale, messageKey, params)

  return <span lang={lang}>{text}</span>
}
