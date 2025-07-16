import Image from 'next/image'

import { InlineLink } from 'components/ui/InlineLink'
import { BASE_PATH } from 'lib/constants'

export const Branching2Preview = () => {
  return (
    <div>
      <Image
        src={`${BASE_PATH}/img/previews/branching-preview.png`}
        width={1296}
        height={900}
        alt="api-docs-side-panel-preview"
        className="rounded border mb-4"
      />
      <p className="text-sm text-foreground-light mb-4">
        Branching 2.0 introduces a new workflow for managing database branches without having to use
        Git. Create branches, review changes and merge back into production all through the
        dashboard. Read the below limitations and our{' '}
        <InlineLink href="https://supabase.com/docs/guides/platform/branching">
          branching documentation
        </InlineLink>{' '}
        before opting in.
      </p>
      <div className="my-6">
        <p className="text-sm text-foreground mb-2 font-medium">Limitations:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Custom roles created through the dashboard are not captured on branch creation.</li>
          <li>
            Only <code>public</code> schema changes are supported right now.
          </li>
          <li>Extensions are not included in the diff process</li>
          <li>
            Branches can only be merged to <code>main</code>; merging between preview branches is
            not supported.
          </li>
          <li>
            If your branch is out of date, you can pull in latest changes from <code>main</code>,
            but keep in mind that all functions will be overwritten.
          </li>
          <li>
            Deleting functions must be done manually on <code>main</code>.
          </li>
          <li>Migration conflicts must be manually resolved on the preview branch.</li>
          <li>
            If you have run migrations on <code>main</code>, new branches will be created from
            existing migrations instead of a full schema dump.
          </li>
        </ul>
      </div>

      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Enable the new Branching 2.0 workflow for your project.</li>
          <li>
            Allow you to create, manage, and merge database branches with improved UI and features.
          </li>
          <li>Access new merge request and deployment management tools.</li>
        </ul>
      </div>
    </div>
  )
}
