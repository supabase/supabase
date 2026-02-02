<Accordion
type="default"
openBehaviour="multiple"
chevronAlign="right"
justified
size="medium"
className="rounded-lg border border-foreground/10 bg-surface-100 text-foreground-light [&>div]:space-y-4 p-4"
>

    <AccordionItem
    header={<span className="text-foreground font-medium">What you can do with the Metrics API</span>}
    id="how-do-i-check-when-a-user-went-through-mfa"
    className="border-0 px-2 py-4"
    >

    Every Supabase project exposes a metrics feed at `https://<project-ref>.supabase.co/customer/v1/privileged/metrics`. Replace `<project-ref>` with the identifier from your project URL or from the dashboard sidebar.

    1. Copy your project reference and confirm the base URL using the helper below.

    <ProjectConfigVariables variable="url" />

    2. Configure your collector to scrape once per minute. The endpoint already emits the full set of metrics on each request.
    3. Authenticate with HTTP Basic Auth:

    - **Username**: `service_role`
    - **Password**: a **Secret API key** (`sb_secret_...`). You can create/copy it in [**Project Settings → API Keys**](/dashboard/project/_/settings/api-keys). For more context, see [Understanding API keys](/docs/guides/api/api-keys).

    Testing locally is as simple as running `curl` with your Secret API key:

    ```bash
    curl <project-url>/customer/v1/privileged/metrics \
    --user 'service_role:sb_secret_...'
    ```

    You can provision long-lived automation tokens in two ways:

    - Create an account access token once at [**Account Settings > Access Tokens**](/dashboard/account/tokens) and reuse it wherever you configure observability tooling.
    - **Optional**: programmatically exchange an access token for project API keys via the [Management API](/docs/reference/api/management-projects-api-keys-retrieve).

    ```bash
    # (Optional) Exchange an account access token for project API keys
    export SUPABASE_ACCESS_TOKEN="your-access-token"
    export PROJECT_REF="your-project-ref"

    curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    "https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys?reveal=true"
    ```

    </AccordionItem>

</Accordion>
