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

export const LanguageSettings = () => {
  const { t, locale, setLocale } = useTranslation()
  const label = t('account.preferences.language.label')

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>{t('account.preferences.language.title')}</PageSectionTitle>
          <PageSectionDescription>
            {t('account.preferences.language.description')}
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <FormItemLayout isReactForm={false} label={label} layout="flex-row-reverse">
              <Select value={locale} onValueChange={(value) => setLocale(parseLocale(value))}>
                <SelectTrigger aria-label={label}>
                  <SelectValue />
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
