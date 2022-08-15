const EDIT_BASE_URL = 'https://github.com/supabase/supabase/edit/master/web'

type PageParmas = {
  id: string
  title: string
  slug: string
  specFileName: string
  description?: string
  parameters?: string
  examples?: string[]
  spotlight?: string
  notes?: string
  result?: string
  errors?: string
}

const Page = ({
  id,
  title,
  slug,
  specFileName,
  description = '',
  parameters = '',
  examples = [],
  spotlight = '',
  notes = '',
  result = '',
  errors = '',
}: PageParmas) =>
  `
---
id: ${id}
title: "${title}"
slug: ${slug}
custom_edit_url: ${EDIT_BASE_URL}/${specFileName}
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

${description}

${spotlight}

${parameters ? `## Parameters` : ''}

${parameters}

${notes ? '## Notes' : ''}

${notes}

${result ? `## Result` : ''}

${result}

${errors ? `## Errors` : ''}

${errors}

${examples.length > 0 ? '## Examples' : ''}

${examples.join(`\n\n`)}

`.trim()

export default Page
