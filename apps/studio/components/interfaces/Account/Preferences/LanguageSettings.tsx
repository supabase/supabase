import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { useTranslation } from '@/lib/i18n/LocaleProvider'
import { LOCALE_LABELS, LOCALES, parseLocale } from '@/lib/i18n/locales'
import { resolveMessage } from '@/lib/i18n/translate'
import { TranslatedText } from '@/lib/i18n/TranslatedText'

export const LanguageSettings = () => {
  const { locale, setLocale } = useTranslation()
  const label = resolveMessage(locale, 'account.preferences.language.label')

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>
            <TranslatedText messageKey="account.preferences.language.title" />
          </PageSectionTitle>
          <PageSectionDescription>
            <TranslatedText messageKey="account.preferences.language.description" />
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              label={<span lang={label.lang}>{label.text}</span>}
              layout="flex-row-reverse"
            >
              <Select value={locale} onValueChange={(value) => setLocale(parseLocale(value))}>
                <SelectTrigger aria-label={label.text} lang={label.lang}>
                  <SelectValue>
                    <span lang={locale}>{LOCALE_LABELS[locale]}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((value) => (
                    <SelectItem key={value} value={value} lang={value}>
                      {LOCALE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItemLayout>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
