# Writing pages

## Rough guidelines

- Try to break down your pages into smaller building blocks - components which are tightly coupled to a page can be placed within the folder `components/interfaces/xxx/...` (Refer to the README.md under the components folder)
- Keep to using `useState` hooks for any UI related logic, do not create MobX local stores to handle UI logic.

## Template for building pages

```tsx
import { NextPage } from 'next'
import { withAuth } from 'hooks/misc/withAuth'

// Import the corresponding layout based on the page
import { Layout } from 'components/layouts'

// Import the main building blocks of the page
import { ... } from 'components/interfaces/xxx'

// Import reusable UI components if needed
import { ... } from 'components/ui/xxx'

// Name your page accordingly
const Page: NextPage = () => {

  return (
    <Layout>
      <div>Page content</div>
    </Layout>
  )
}

export default withAuth(Page)
```
