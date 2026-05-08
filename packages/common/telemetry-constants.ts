/**
 * Consolidated event definitions coming from the frontend, including studio, www, and docs.
 *
 * Note that events are not emitted for users that have opted out of telemetry.
 *
 * ## Naming conventions
 * Event names and actions should use standardized past-tense verbs for data quality and consistency.
 * Only use verbs already established in this file or in https://github.com/supabase/platform/blob/develop/shared/src/telemetry.ts
 * Adding new verbs requires @growth-eng review to prevent data pollution.
 *
 * @module telemetry-frontend
 */

export type TelemetryGroups = {
  project: string
  organization: string
}

export const TABLE_EVENT_ACTIONS = {
  TableCreated: 'table_created',
  TableDataAdded: 'table_data_added',
  TableRLSEnabled: 'table_rls_enabled',
} as const

export type TableEventAction = (typeof TABLE_EVENT_ACTIONS)[keyof typeof TABLE_EVENT_ACTIONS]

export const TABLE_EVENT_VALUES: TableEventAction[] = Object.values(TABLE_EVENT_ACTIONS)

/**
 * Triggered when a user signs up. When signing up with Email and Password, this is only triggered once user confirms their email.
 *
 * @group Events
 * @source studio
 * @page /sign-up
 */
export interface SignUpEvent {
  action: 'sign_up'
  properties: {
    category: 'conversion'
  }
}

/**
 * Triggered when a user signs in with GitHub, Email and Password or SSO.
 *
 * Some unintuitive behavior:
 *   - If signing up with GitHub the SignInEvent gets triggered first before the SignUpEvent.
 *
 * @group Events
 * @source studio
 * @page /sign-in-mfa
 */
export interface SignInEvent {
  action: 'sign_in'
  properties: {
    category: 'account'
    /**
     * The method used to sign in, e.g. email, github, sso
     */
    method: string
  }
}

/**
 * User copied the database connection string.
 *
 * @group Events
 * @source studio
 */
export interface ConnectionStringCopiedEvent {
  action: 'connection_string_copied'
  properties: {
    /**
     * Method selected by user, e.g. URI, PSQL, SQLAlchemy, MCP URL, Framework snippet, Command Line, JSON, etc.
     * Required for Connection String, App Frameworks, and Mobile Frameworks tabs
     */
    connectionType?: string
    /**
     * Language of the code block if selected, e.g. bash, go, http, typescript
     * Required for Connection String, App Frameworks, and Mobile Frameworks tabs
     */
    lang?: string
    /**
     * Connection Method, e.g. direct, transaction_pooler, session_pooler
     * Only used for Connection String tab
     */
    connectionMethod?: 'direct' | 'transaction_pooler' | 'session_pooler'
    /**
     * Tab from which the connection string was copied
     */
    connectionTab: 'Connection String' | 'App Frameworks' | 'Mobile Frameworks' | 'ORMs' | 'MCP'
    /**
     * Selected framework, tool, or client (e.g., 'Next.js', 'Prisma', 'Cursor')
     */
    selectedItem?: string
    /**
     * Source of the event, either 'studio' or 'docs'
     */
    source?: 'studio' | 'docs'
  }
  groups: TelemetryGroups
}

/**
 * User clicked the MCP install button (one-click installation for Cursor or VS Code).
 *
 * @group Events
 * @source studio, docs
 */
export interface McpInstallButtonClickedEvent {
  action: 'mcp_install_button_clicked'
  properties: {
    /**
     * The MCP client that was selected (e.g., 'Cursor', 'VS Code')
     */
    client: string
    /**
     * Source of the event, either 'studio' or 'docs'
     */
    source?: 'studio' | 'docs'
  }
  groups: TelemetryGroups
}

/**
 * Cron job created.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs?new=true
 */
export interface CronJobCreatedEvent {
  action: 'cron_job_created'
  properties: {
    /**
     * What the cron job executes, e.g. sql_function or sql_snippet
     */
    type: 'sql_function' | 'sql_snippet' | 'edge_function' | 'http_request'
    /**
     * Schedule of the cron job in the format of * * * * *
     */
    schedule: string
  }
  groups: TelemetryGroups
}

/**
 * Cron job updated.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs?new=true
 */
export interface CronJobUpdatedEvent {
  action: 'cron_job_updated'
  properties: {
    /**
     * What the cron job executes, e.g. sql_function or sql_snippet
     */
    type: 'sql_function' | 'sql_snippet' | 'edge_function' | 'http_request'
    /**
     * Schedule of the cron job in the format of * * * * *
     */
    schedule: string
  }
  groups: TelemetryGroups
}

/**
 * Cron job removed. Previously: cron_job_deleted
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobRemovedEvent {
  action: 'cron_job_removed'
  groups: TelemetryGroups
}

/**
 * Create job button clicked that opens the dialog.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobCreateClickedEvent {
  action: 'cron_job_create_clicked'
  groups: TelemetryGroups
}

/**
 * Edit cron job button (hidden in the dropdown) clicked that opens the dialog.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobUpdateClickedEvent {
  action: 'cron_job_update_clicked'
  groups: TelemetryGroups
}

/**
 * Delete cron job button (hidden in the dropdown) clicked that opens the deletion confirmation modal.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobDeleteClickedEvent {
  action: 'cron_job_delete_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the history button to see previous runs of the cron job
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobHistoryClickedEvent {
  action: 'cron_job_history_clicked'
  groups: TelemetryGroups
}

/**
 * A feature preview was enabled by the user through the FeaturePreviewModal.
 *
 * The FeaturePreviewModal can be opened clicking at the profile icon at the bottom left corner of the project sidebar.
 *
 * @group Events
 * @source studio
 */
export interface FeaturePreviewEnabledEvent {
  action: 'feature_preview_enabled'
  properties: {
    /**
     * Feature key of the preview that was enabled. e.g. supabase-ui-api-side-panel
     */
    feature: string
  }
  groups: TelemetryGroups
}

/**
 * A feature preview was disabled by the user through the FeaturePreviewModal.
 *
 * The FeaturePreviewModal can be opened clicking at the profile icon at the bottom left corner of the project sidebar.
 *
 * @group Events
 * @source studio
 */
export interface FeaturePreviewDisabledEvent {
  action: 'feature_preview_disabled'
  properties: {
    /**
     * Feature key of the preview that was disabled. e.g. supabase-ui-api-side-panel
     */
    feature: string
  }
  groups: TelemetryGroups
}

/**
 * The user picked a timezone in the dashboard timezone picker (in the user
 * avatar dropdown). Setting an explicit IANA value or returning to the auto
 * detected default both fire this event.
 *
 * @group Events
 * @source studio
 */
export interface TimezonePickerClickedEvent {
  action: 'timezone_picker_clicked'
  properties: {
    /** IANA name resolved before the change. */
    previousTimezone: string
    /** IANA name resolved after the change. */
    nextTimezone: string
    /** True when the user opted back into the browser-detected default. */
    isAutoDetected: boolean
    /** Where the picker was rendered. */
    source: 'user_dropdown' | 'account_preferences'
  }
  groups: TelemetryGroups
}
/**
 * User was exposed to the project creation form (exposure event for RLS option experiment).
 *
 * @group Events
 * @source studio
 * @page new/{slug}
 */
export interface ProjectCreationRlsOptionExperimentExposedEvent {
  action: 'project_creation_rls_option_experiment_exposed'
  properties: {
    /**
     * Experiment variant: 'control' (checkbox hidden) or 'test' (checkbox shown)
     */
    variant: 'control' | 'test'
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * Top-of-funnel event for the dataApiRevokeOnCreateDefault rollout. Fires once per
 * mount after the flag resolves so cohort attribution is clean — pair with
 * project_creation_simple_version_submitted to measure the flag's impact on
 * project creation completion rate.
 *
 * @group Events
 * @source studio
 * @page new/{slug} and /integrations/vercel/{slug}/deploy-button/new-project
 */
export interface ProjectCreationDefaultPrivilegesExposedEvent {
  action: 'project_creation_default_privileges_exposed'
  properties: {
    /** Where the checkbox was shown. */
    surface: 'main' | 'vercel'
    /**
     * State of the "Enable Data API" toggle at exposure time. Main flow only —
     * the Vercel surface has no such toggle, so this is omitted there.
     */
    dataApiEnabled?: boolean
    /**
     * Raw value of the dataApiRevokeOnCreateDefault PostHog flag at exposure time.
     * true = revoke cohort (checkbox defaulted to unchecked)
     * false = control cohort (checkbox defaulted to checked)
     */
    dataApiRevokeOnCreateDefaultEnabled: boolean
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * Project creation form was submitted and the project was created. Fires from both
 * the main project creation wizard and the Vercel deploy-button flow — disambiguate
 * by the `surface` property.
 *
 * @group Events
 * @source studio
 * @page new/{slug} and /integrations/vercel/{slug}/deploy-button/new-project
 */
export interface ProjectCreationSimpleVersionSubmittedEvent {
  action: 'project_creation_simple_version_submitted'
  properties: {
    /**
     * Which surface produced the submission. Omitted on events emitted before this
     * property was introduced; treat absent as 'main' for backfill.
     */
    surface?: 'main' | 'vercel'
    /**
     * The instance size selected in the project creation form.
     */
    instanceSize?: string
    /**
     * Whether the automatic RLS event trigger option was enabled
     */
    enableRlsEventTrigger?: boolean
    /**
     * Experiment variant: 'control' (checkbox not shown) or 'test' (checkbox shown)
     */
    rlsOptionVariant?: 'control' | 'test'
    /**
     * Whether Data API is enabled.
     * true = "Data API + Connection String" (default)
     * false = "Only Connection String"
     */
    dataApiEnabled?: boolean
    /**
     * Data API schema configuration. Only relevant when dataApiEnabled is true.
     * true = "Use dedicated API schema for Data API"
     * false = "Use public schema for Data API" (default)
     */
    useApiSchema?: boolean
    /**
     * Postgres engine type selection.
     * true = "Postgres with OrioleDB" (alpha)
     * false = "Postgres" (default)
     */
    useOrioleDb?: boolean
    /**
     * Raw checkbox state for "Automatically expose new tables and functions" at submission.
     * true = default privileges are granted on new entities (current behaviour)
     * false = revoke SQL ran; user must manually grant access per entity
     */
    dataApiDefaultPrivilegesGranted?: boolean
    /**
     * Whether the dataApiRevokeOnCreateDefault PostHog flag was enabled for this user.
     * Controls only the default checkbox state of "Automatically expose new tables and functions"
     * at project creation. Tracking it lets us correlate flag cohort with user choice.
     * true = user is in the staged rollout cohort (checkbox defaulted to unchecked)
     * false = user is outside the rollout (checkbox defaulted to checked)
     * omitted = PostHog flags had not loaded at the time of project creation
     */
    dataApiRevokeOnCreateDefaultEnabled?: boolean
  }
  groups: TelemetryGroups
}

/**
 * Existing project creation form confirm modal was triggered and opened.
 *
 * @group Events
 * @source studio
 * @page new/{slug}
 */
export interface ProjectCreationSimpleVersionConfirmModalOpenedEvent {
  action: 'project_creation_simple_version_confirm_modal_opened'
  /**
   * the instance size selected in the project creation form
   */
  properties: {
    instanceSize?: string
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * User toggled Data API access on a table via the switch in the table editor side panel.
 * Only fires for new tables — editing existing tables links out to the settings page instead.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface TableApiAccessToggleClickedEvent {
  action: 'table_api_access_toggle_clicked'
  properties: {
    /**
     * The resulting state of the toggle after the click.
     */
    newState: 'enabled' | 'disabled'
    /**
     * The schema containing the table being created.
     */
    schemaName: string
  }
  groups: TelemetryGroups
}

/**
 * On the InitialStep.tsx screen, where user can chose to prompt, start blank or migrate, at least 5 characters were typed
 * in the prompt textarea indicating an intention to use the prompt.
 *
 * @group Events
 * @source studio
 * @page new/v2/{slug}
 */
export interface ProjectCreationInitialStepPromptIntendedEvent {
  action: 'project_creation_initial_step_prompt_intended'
  /**
   * Is this a new prompt (e.g. when following the start blank route where no prompt has been filled in the InitialStep). In other
   * words, was this not just an edit. In this case, it should always be true.
   */
  properties: {
    isNewPrompt: boolean
  }
}

/**
 * First step of project creation was submitted, where the user writes a prompt or select to start blank or to migrate.
 *
 * @group Events
 * @source studio
 * @page new/v2/{slug}
 */
export interface ProjectCreationInitialStepSubmittedEvent {
  action: 'project_creation_initial_step_submitted'
  properties: {
    /**
     * Records what the user selected in the first step of project creation.
     */
    onboardingPath: 'use_prompt' | 'start_blank' | 'migrate'
  }
}

/**
 * After the InitialStep screen, at least 5 characters were typed in the prompt textarea indicating an intention to use the prompt.
 *
 * @group Events
 * @source studio
 * @page new/v2/{slug}
 */
export interface ProjectCreationSecondStepPromptIntendedEvent {
  action: 'project_creation_second_step_prompt_intended'
  properties: {
    /**
     * Is this a new prompt (e.g. when following the start blank route where no prompt has been filled in the InitialStep). In other
     * words, was this not just an edit.
     */
    isNewPrompt: boolean
  }
}

/**
 * Second and final step of project creation was submitted. More precisely, right after the user clicks on "Create Project". To check,
 * if the project creation was successful, please refer to project_created event.
 *
 * @group Events
 * @source studio
 * @page new/v2/{slug}
 */
export interface ProjectCreationSecondStepSubmittedEvent {
  action: 'project_creation_second_step_submitted'
}

/**
 * User clicked either "Listening to channel" or "Start listening" button after selecting a channel.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorListenChannelClickedEvent {
  action: 'realtime_inspector_listen_channel_clicked'
  groups: TelemetryGroups
}

/**
 * A broadcast message was sent from the SendMessageModal.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorBroadcastSentEvent {
  action: 'realtime_inspector_broadcast_sent'
  groups: TelemetryGroups
}

/**
 * User clicked a message in the RealtimeInspector, which opens a sidebar that shows the messsage details including metadata.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorMessageClickedEvent {
  action: 'realtime_inspector_message_clicked'
  groups: TelemetryGroups
}

/**
 * A message was copied from the RealtimeInspector.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorCopyMessageClickedEvent {
  action: 'realtime_inspector_copy_message_clicked'
  groups: TelemetryGroups
}

/**
 * Filters were applied in the RealtimeInspector.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorFiltersAppliedEvent {
  action: 'realtime_inspector_filters_applied'
  groups: TelemetryGroups
}

/**
 * Database role was updated in the RealtimeInspector.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorDatabaseRoleUpdatedEvent {
  action: 'realtime_inspector_database_role_updated'
  groups: TelemetryGroups
}

/**
 * User clicked to toggle realtime on a table.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface RealtimeToggleTableClickedEvent {
  action: 'realtime_toggle_table_clicked'
  properties: {
    /**
     * The state of the toggle.
     */
    newState: 'enabled' | 'disabled'
    /**
     * Where the toggle was clicked from
     */
    origin: 'tableSidePanel' | 'tableGridHeader'
  }
  groups: TelemetryGroups
}

/**
 * Realtime was enabled on a table.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface TableRealtimeEnabledEvent {
  action: 'table_realtime_enabled'
  properties: {
    /**
     * The method used to enable realtime
     */
    method: 'ui' | 'sql_editor' | 'api'
    /**
     * Schema name
     */
    schema_name: string
    /**
     * Table name
     */
    table_name: string
  }
  groups: TelemetryGroups
}

/**
 * Realtime was disabled on a table.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface TableRealtimeDisabledEvent {
  action: 'table_realtime_disabled'
  properties: {
    /**
     * The method used to disable realtime
     */
    method: 'ui' | 'sql_editor' | 'api'
    /**
     * Schema name
     */
    schema_name: string
    /**
     * Table name
     */
    table_name: string
  }
  groups: TelemetryGroups
}

/**
 * User clicked the quickstart card in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorQuickstartClickedEvent {
  action: 'sql_editor_quickstart_clicked'
  properties: {
    /**
     * The title of the quickstart card clicked.
     */
    quickstartName: string
  }
  groups: TelemetryGroups
}

/**
 * User clicked the template card in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorTemplateClickedEvent {
  action: 'sql_editor_template_clicked'
  properties: {
    /**
     * The name of the template card clicked.
     */
    templateName: string
  }
  groups: TelemetryGroups
}

/**
 * User clicked the "Result download CSV" button in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorResultDownloadCsvClickedEvent {
  action: 'sql_editor_result_download_csv_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the "Result copy Markdown" button in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorResultCopyMarkdownClickedEvent {
  action: 'sql_editor_result_copy_markdown_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the "Result copy JSON" button in the SQL editor
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorResultCopyJsonClickedEvent {
  action: 'sql_editor_result_copy_json_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the "Result copy CSV" button in the SQL editor
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorResultCopyCsvClickedEvent {
  action: 'sql_editor_result_copy_csv_clicked'
  groups: TelemetryGroups
}

/**
 * User submitted a prompt to the assistant sidebar.
 *
 * @group Events
 * @source studio
 */
export interface AssistantPromptSubmittedEvent {
  action: 'assistant_prompt_submitted'
  properties: {
    /** UUID of the chat session in which the prompt was submitted */
    chatId?: string
  }
  groups: TelemetryGroups
}

/**
 * User submitted a debug request to the assistant sidebar or prompt submitted has Help me to debug.
 *
 * @group Events
 * @source studio
 */
export interface AssistantDebugSubmittedEvent {
  action: 'assistant_debug_submitted'
  properties: {
    /** UUID of the chat session in which the debug request was submitted */
    chatId?: string
  }
  groups: TelemetryGroups
}

/**
 * User clicked the run query button in the suggestion provided in the assistant sidebar.
 *
 * @group Events
 * @source studio
 */
export interface AssistantSuggestionRunQueryClickedEvent {
  action: 'assistant_suggestion_run_query_clicked'
  properties: {
    /**
     * The type of suggestion that was run by the user. Mutate or Select query types only.
     */
    queryType: string
    category?: string
  }
  groups: TelemetryGroups
}

/**
 * User accepted or rejected changes in sql ai diff handler.
 * They can accept change by clicking accept button or typing shortcut (CMD+Enter) or reject by clicking reject button or typing shortcut (Esc).
 * Handler only appears after clicking any dropdown option in Edit in Sql Editor in suggestion provided by the assistant.
 * The dropdown options only appear in any page with 'sql' in url.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface AssistantSqlDiffHandlerEvaluatedEvent {
  action: 'assistant_sql_diff_handler_evaluated'
  properties: {
    /**
     * Whether the user accepted or rejected the changes.
     */
    handlerAccepted: boolean
  }
  groups: TelemetryGroups
}

/**
 * User clicked Edit in SQL Editor button in the assistant sidebar when user is in any page that does not have 'sql' in url or is in a new snippet.
 *
 * @group Events
 * @source studio
 */
export interface AssistantEditInSqlEditorClickedEvent {
  action: 'assistant_edit_in_sql_editor_clicked'
  properties: {
    /**
     * Whether the user is in the SQL editor page or in a new snippet.
     */
    isInSQLEditor: boolean
    isInNewSnippet: boolean
  }
  groups: TelemetryGroups
}

/**
 * User clicked on Add block -> SQL Snippets -> a SQL snippet in a custom reports page.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/reports/{id}
 */
export interface CustomReportAddSQLBlockClickedEvent {
  action: 'custom_report_add_sql_block_clicked'
  groups: TelemetryGroups
}

/**
 * User dragged and dropped a SQL block from the Assistant Panel into the custom report while on a custom report page.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/reports/{id}
 */
export interface CustomReportAssistantSQLBlockAddedEvent {
  action: 'custom_report_assistant_sql_block_added'
  groups: TelemetryGroups
}

/**
 * User voted on the feedback button on a docs page. The feedback button is located at the sidebar of every docs page.
 *
 * @group Events
 * @source docs
 */
export interface DocsFeedbackClickedEvent {
  action: 'docs_feedback_clicked'
  properties: {
    /**
     * 'yes' means clicking on the tick button, 'no' means clicking on the cross button.
     */
    response: 'yes' | 'no'
  }
}

/**
 * User clicked 'Copy as Markdown' option on a page.
 *
 * @group Events
 * @source docs
 */
export interface CopyAsMarkdownEvent {
  action: 'copy_as_markdown_clicked'
}

/**
 * User clicked "Ask..." to open a new window to consult an agent about the current page.
 *
 * @group Events
 * @source docs
 */
export interface AskAIEvent {
  action: 'ask_ai_clicked'
  properties: {
    agent: 'chatgpt' | 'claude'
  }
}

/**
 * User clicked the framework quickstart card on the homepage, leading to the specific framework documentation.
 *
 * @group Events
 * @source www
 * @page /
 */
export interface HomepageFrameworkQuickstartClickedEvent {
  action: 'homepage_framework_quickstart_clicked'
  properties: {
    /**
     * The name of the framework quickstart card clicked.
     */
    frameworkName: string
  }
}

/**
 * User clicked on a product card in the homepage products section.
 *
 * @group Events
 * @source www
 * @page /
 */
export interface HomepageProductCardClickedEvent {
  action: 'homepage_product_card_clicked'
  properties: {
    product: string
  }
}

/**
 * User clicked on the CTA button on a plan in the pricing page.
 *
 * @group Events
 * @source www
 * @page /pricing
 */
export interface WwwPricingPlanCtaClickedEvent {
  action: 'www_pricing_plan_cta_clicked'
  properties: {
    /**
     * The plan type that was clicked.
     */
    plan: string
    /**
     * Whether the upgrade now text is shown on the cta button. This is only shown when org is upgradeable and user is logged in.
     */
    showUpgradeText: boolean
    /**
     * The section of the page where the plan was clicked.
     * Main means the big top section of the page,
     * comparison_table means the comparison table with all plans listed together below.
     */
    section: 'main' | 'comparison_table'
    tableMode?: 'mobile' | 'desktop'
  }
}

/**
 * User clicked the main CTA button in an event page.
 *
 * @group Events
 * @source www
 * @page /events/*
 */
export interface EventPageCtaClickedEvent {
  action: 'www_pricing_plan_cta_clicked'
  properties: {
    /**
     * The title of the event clicked.
     */
    eventTitle: string
  }
}

/**
 * User clicked the GitHub button in the homepage header section. The button is hidden in mobile view.
 *
 * @group Events
 * @source www
 * @page /
 */
export interface HomepageGitHubButtonClickedEvent {
  action: 'homepage_github_button_clicked'
}

/**
 * User clicked the Discord button in the homepage community section.
 *
 * @group Events
 * @source www
 * @page /
 */
export interface HomepageDiscordButtonClickedEvent {
  action: 'homepage_discord_button_clicked'
}

/**
 * User clicked a customer story card in the homepage.
 *
 * @group Events
 * @source www
 * @page /
 */
export interface HomepageCustomerStoryCardClickedEvent {
  action: 'homepage_customer_story_card_clicked'
  properties: {
    customer?: string
    /**
     * The size of the card clicked.
     */
    cardType: 'expanded' | 'narrow'
  }
}

/**
 * User clicked the project template card in the homepage.
 *
 * @group Events
 * @source www
 * @page /
 */
export interface HomepageProjectTemplateCardClickedEvent {
  action: 'homepage_project_template_card_clicked'
  properties: {
    /**
     * The title of the project template card clicked.
     */
    templateTitle: string
  }
}

/**
 * User clicked the open source repository card.
 *
 * @group Events
 * @source www
 * @page /open-source
 */
export interface OpenSourceRepoCardClickedEvent {
  action: 'open_source_repo_card_clicked'
  properties: {
    /**
     * The name of the open source repository clicked.
     */
    repoName: string
  }
}

/**
 * User clicked the green "Start Project" button in various locations described in properties.
 *
 * @group Events
 * @source www
 */
export interface StartProjectButtonClickedEvent {
  action: 'start_project_button_clicked'
  properties: {
    /**
     * The source of the button click, e.g. homepage hero, product page header.
     */
    buttonLocation: string
  }
}

/**
 * User clicked the "See Documentation" button usually next to the "Start Project" button in various locations described in properties.
 *
 * @group Events
 * @source www
 */
export interface SeeDocumentationButtonClickedEvent {
  action: 'see_documentation_button_clicked'
  properties: {
    /**
     * The source of the button click, e.g. homepage hero, product page header - product name.
     */
    buttonLocation: string
  }
}

/**
 * User clicked the "Request a Demo" button in various locations described in properties.
 *
 * @group Events
 * @source www
 */
export interface RequestDemoButtonClickedEvent {
  action: 'request_demo_button_clicked'
  properties: {
    /**
     * The source of the button click, e.g. homepage hero, cta banner, product page header.
     * If it states it came from the request demo form, it can come from different pages so refer to path name to determine.
     */
    buttonLocation: string
  }
}

/**
 * User clicked the "Register" button in the State of Startups 2025 newsletter form.
 *
 * @group Events
 * @source www
 */
export interface RegisterStateOfStartups2025NewsletterClicked {
  action: 'register_for_state_of_startups_newsletter_clicked'
  properties: {
    /**
     * The source of the button click, e.g. homepage hero, cta banner, product page header.
     * If it states it came from the request demo form, it can come from different pages so refer to path name to determine.
     */
    buttonLocation: string
  }
}

/**
 * User clicked the sign-in button in various locations described in properties.
 *
 * @group Events
 * @source www
 */
export interface SignInButtonClickedEvent {
  action: 'sign_in_button_clicked'
  properties: {
    /**
     * The source of the button click, e.g. homepage hero, cta banner, product page header.
     */
    buttonLocation: string
  }
}

/**
 * User clicked the "Help" button in the top right corner of the page header.
 *
 * @group Events
 * @source studio
 */
export interface HelpButtonClickedEvent {
  action: 'help_button_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the "Send Feedback" button in the top right corner of the page header.
 *
 * @group Events
 * @source studio
 */
export interface SendFeedbackButtonClickedEvent {
  action: 'send_feedback_button_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked on an example project card.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface ExampleProjectCardClickedEvent {
  action: 'example_project_card_clicked'
  properties: {
    /**
     * The title of the example project card clicked.
     */
    cardTitle: string
  }
  groups: TelemetryGroups
}

/**
 * User clicked the "Import Data" button.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface ImportDataButtonClickedEvent {
  action: 'import_data_button_clicked'
  properties: {
    /**
     * The type of table the data is imported to.
     * New Table means added when creating new table by clicking from New table sidebar,
     * Existing Table means added to an existing table by going to the table and clicking from the green Insert button..
     */
    tableType: 'New Table' | 'Existing Table'
  }
  groups: TelemetryGroups
}

/**
 * User dropped a file into the import data dropzone on an empty table.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface ImportDataFileDroppedEvent {
  action: 'import_data_dropzone_file_added'
  groups: TelemetryGroups
}

/**
 * User added data from the import data via CSV/spreadsheet successfully.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface ImportDataAddedEvent {
  action: 'import_data_added'
  groups: TelemetryGroups
}

/**
 * User clicked the run query button in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql/{id}
 */
export interface SqlEditorQueryRunButtonClickedEvent {
  action: 'sql_editor_query_run_button_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked on the CTA button on a plan in the pricing side panel in studio.
 *
 * @group Events
 * @source studio
 * @page /billing?panel=subscriptionPlan
 */
export interface StudioPricingPlanCtaClickedEvent {
  action: 'studio_pricing_plan_cta_clicked'
  properties: {
    /**
     * The plan type that was clicked.
     */
    selectedPlan: string
    /**
     * The plan type the org is currently on.
     */
    currentPlan?: string
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * User opened the pricing side panel in studio.
 *
 * @group Events
 * @source studio
 * @page /billing?panel=subscriptionPlan
 */
export interface StudioPricingSidePanelOpenedEvent {
  action: 'studio_pricing_side_panel_opened'
  properties: {
    currentPlan?: string
    /**
     * Tracks how user landed on the Pricing side panel, e.g. diskManagementPanelDiskSize, backupsRestoreToNewProject
     */
    origin?: string
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * User clicks on grafana banner in studio Reports page.
 *
 * @group Events
 * @source studio
 * @page /reports/database
 */
export interface ReportsDatabaseGrafanaBannerClickedEvent {
  action: 'reports_database_grafana_banner_clicked'
  groups: TelemetryGroups
}

/**
 * User clicks on Metrics API banner CTA button in studio Observability pages.
 *
 * @group Events
 * @source studio
 * @page /observability/*
 */
export interface MetricsAPIBannerCtaButtonClickedEvent {
  action: 'metrics_api_banner_cta_button_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the dismiss button on a banner in studio Observability pages.
 *
 * @group Events
 * @source studio
 * @page /observability/*
 */
export interface MetricsAPIBannerDismissButtonClickedEvent {
  action: 'metrics_api_banner_dismiss_button_clicked'
  groups: TelemetryGroups
}

/**
 * Index Advisor banner enable button clicked event.
 *
 * @group Events
 * @source studio
 * @page /observability/query-performance
 */
export interface IndexAdvisorBannerEnableButtonClickedEvent {
  action: 'index_advisor_banner_enable_button_clicked'
  groups: TelemetryGroups
}

/**
 * Index Advisor dialog enable button clicked event.
 *
 * @group Events
 * @source studio
 * @page /observability/query-performance
 */
export interface IndexAdvisorDialogEnableButtonClickedEvent {
  action: 'index_advisor_dialog_enable_button_clicked'
  groups: TelemetryGroups
}

/**
 * Index Advisor banner dimissed event.
 *
 * @group Events
 * @source studio
 * @page /observability/query-performance
 */
export interface IndexAdvisorBannerDismissButtonClickedEvent {
  action: 'index_advisor_banner_dismiss_button_clicked'
  groups: TelemetryGroups
}

/**
 * Index Advisor tab clicked event.
 *
 * @group Events
 * @source studio
 * @page /observability/query-performance
 */
export interface IndexAdvisorTabClickedEvent {
  action: 'index_advisor_tab_clicked'
  properties: {
    hasRecommendations: boolean
    isIndexAdvisorEnabled: boolean
  }
  groups: TelemetryGroups
}

/**
 * Index Advisor create indexes button clicked event.
 *
 * @group Events
 * @source studio
 * @page /observability/query-performance
 */
export interface IndexAdvisorCreateIndexesButtonClickedEvent {
  action: 'index_advisor_create_indexes_button_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the deploy button for an Edge Function.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions/new
 */
export interface EdgeFunctionDeployButtonClickedEvent {
  action: 'edge_function_deploy_button_clicked'
  properties: {
    /**
     * Click on Deploy can either happen:
     *   1. in the functions editor page
     *   2. in the chat button in the functions editor
     */
    origin: 'functions_editor' | 'functions_ai_assistant'
  }
  groups: TelemetryGroups
}

/**
 * User clicked the confirm deploy updates button for an Edge Function in the code page within the warning model.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions/{id}/code
 */
export interface EdgeFunctionDeployUpdatesConfirmClickedEvent {
  action: 'edge_function_deploy_updates_confirm_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the AI Assistant button to create an Edge Function.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions
 */
export interface EdgeFunctionAiAssistantButtonClickedEvent {
  action: 'edge_function_ai_assistant_button_clicked'
  properties: {
    /**
     * Click on AI Assistant can either happen:
     *   1. on the main block when there are no functions
     *   2. in the secondary action section of the page
     *   3. on the chat button in the functions editor
     */
    origin: 'no_functions_block' | 'secondary_action' | 'functions_editor_chat'
  }
  groups: TelemetryGroups
}

/**
 * User clicked the button to go to the functions editor page to create an edge function.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions
 */
export interface EdgeFunctionViaEditorButtonClickedEvent {
  action: 'edge_function_via_editor_button_clicked'
  properties: {
    /**
     * Click on Via Editor can either happen:
     *   1. on the main block when there are no functions
     *   2. in the secondary action section of the page
     */
    origin: 'no_functions_block' | 'secondary_action'
  }
  groups: TelemetryGroups
}

/**
 * User clicked on an Edge Function template.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions
 */
export interface EdgeFunctionTemplateClickedEvent {
  action: 'edge_function_template_clicked'
  properties: {
    templateName: string
    /**
     * Where the edge function template was clicked from:
     *  1. functions page
     *  2. editor page
     */
    origin: 'functions_page' | 'editor_page'
  }
  groups: TelemetryGroups
}

/**
 * User clicked the button to create an edge function via CLI.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions
 */
export interface EdgeFunctionViaCliButtonClickedEvent {
  action: 'edge_function_via_cli_button_clicked'
  properties: {
    /**
     * Click on Via CLI can either happen:
     *   1. on the main block when there are no functions
     *   2. in the secondary action section of the page
     */
    origin: 'no_functions_block' | 'secondary_action'
  }
  groups: TelemetryGroups
}

/**
 * User clicked the deploy updates button for an edge function.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions/{id}/code
 */
export interface EdgeFunctionDeployUpdatesButtonClickedEvent {
  action: 'edge_function_deploy_updates_button_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the Send Request button for testing an Edge Function.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions/{id}
 */
export interface EdgeFunctionTestSendButtonClickedEvent {
  action: 'edge_function_test_send_button_clicked'
  properties: {
    /**
     * The HTTP method used for the test request, e.g., GET, POST.
     */
    httpMethod: string
  }
  groups: TelemetryGroups
}

/**
 * User opened the side panel for testing an edge function.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/functions/{id}
 */
export interface EdgeFunctionTestSidePanelOpenedEvent {
  action: 'edge_function_test_side_panel_opened'
  groups: TelemetryGroups
}

/**
 * User submitted a support ticket. Project and organization are optional because the ticket might be about user account issues.
 *
 * @group Events
 * @source studio
 * @page /dashboard/support/new
 */
export interface SupportTicketSubmittedEvent {
  action: 'support_ticket_submitted'
  properties: {
    ticketCategory: string
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the AI Assistant card on top of the support ticket form.
 * This event is specifically when the user goes back to the AI Assistant in the Studio.
 *
 * @group Events
 * @source studio
 * @page /dashboard/support/new
 */
export interface AiAssistantInSupportFormClickedEvent {
  action: 'ai_assistant_in_support_form_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User rated an AI assistant message with thumbs up or thumbs down.
 *
 * @group Events
 * @source studio
 */
export interface AssistantMessageRatingSubmittedEvent {
  action: 'assistant_message_rating_submitted'
  properties: {
    /**
     * The rating given by the user: positive (thumbs up) or negative (thumbs down)
     */
    rating: 'positive' | 'negative'
    /**
     * The category of the conversation
     */
    category:
      | 'sql_generation'
      | 'schema_design'
      | 'rls_policies'
      | 'edge_functions'
      | 'database_optimization'
      | 'debugging'
      | 'general_help'
      | 'other'
    /** Optional reason provided by the user when rating negatively */
    reason?: string
    /** UUID of the chat session in which the message was rated */
    chatId?: string
  }
  groups: TelemetryGroups
}

/**
 * User copied the command for a Supabase UI component.
 *
 * @group Events
 * @source supabase-ui
 * @page /ui/docs/{framework}/{templateTitle}
 */
export interface SupabaseUiCommandCopyButtonClickedEvent {
  action: 'supabase_ui_command_copy_button_clicked'
  properties: {
    templateTitle: string
    command: string
    framework: 'nextjs' | 'react-router' | 'tanstack' | 'react' | 'vue' | 'nuxtjs'
    packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun'
  }
}

/**
 * Triggered when the organization MFA enforcement setting is updated.
 *
 * @group Events
 * @source studio
 * @page /dashboard/org/{slug}/security
 */
export interface OrganizationMfaEnforcementUpdatedEvent {
  action: 'organization_mfa_enforcement_updated'
  properties: {
    mfaEnforced: boolean
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * Triggered when a new foreign data wrapper is created in a project.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/database/integrations
 */
export interface ForeignDataWrapperCreatedEvent {
  action: 'foreign_data_wrapper_created'
  properties: {
    /**
     * The type of the foreign data wrapper, e.g. postgres_fdw, mysql_fdw, etc.
     */
    wrapperType: string
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a new storage bucket is created in a project.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/storage/buckets
 */
export interface StorageBucketCreatedEvent {
  action: 'storage_bucket_created'
  properties: {
    /**
     * The type of the bucket created. E.g. standard or analytics iceberg.
     */
    bucketType?: string
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a new branch is created.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/branches
 */
export interface BranchCreateButtonClickedEvent {
  action: 'branch_create_button_clicked'
  properties: {
    /**
     * The type of branch created, e.g. preview, persistent
     */
    branchType: 'preview' | 'persistent'
    /**
     * Whether the branch was created with a git branch association
     */
    gitlessBranching: boolean
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a branch delete button is clicked.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/branches
 */
export interface BranchDeleteButtonClickedEvent {
  action: 'branch_delete_button_clicked'
  properties: {
    /**
     * The type of branch being deleted, e.g. preview, persistent
     */
    branchType?: 'preview' | 'persistent'
    /**
     * Where the delete action was initiated from
     */
    origin: 'branches_page' | 'merge_page'
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a create merge request is clicked for a branch.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/branches
 */
export interface BranchCreateMergeRequestButtonClickedEvent {
  action: 'branch_create_merge_request_button_clicked'
  properties: {
    /**
     * The type of branch being merged, e.g. preview, persistent
     */
    branchType: 'preview' | 'persistent'
    origin: 'header' | 'merge_page' | 'branch_selector'
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a merge request is closed.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/branches/merge-requests
 */
export interface BranchCloseMergeRequestButtonClickedEvent {
  action: 'branch_close_merge_request_button_clicked'
  groups: TelemetryGroups
}

/**
 * Triggered when a user clicks the merge button successfully to attempt merging a branch.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/merge
 */
export interface BranchMergeSubmittedEvent {
  action: 'branch_merge_submitted'
  groups: TelemetryGroups
}

/**
 * Triggered when a branch merge completes successfully. Previously: branch_merge_succeeded
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/merge
 */
export interface BranchMergeCompletedEvent {
  action: 'branch_merge_completed'
  properties: {
    /**
     * The type of branch being merged, e.g. preview, persistent
     */
    branchType: 'preview' | 'persistent'
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a branch merge fails.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/merge
 */
export interface BranchMergeFailedEvent {
  action: 'branch_merge_failed'
  properties: {
    /**
     * The type of branch being merged, e.g. preview, persistent
     */
    branchType: 'preview' | 'persistent'
    /**
     * The error message or reason for failure
     */
    error?: string
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a branch is updated on push with latest changes from production.
 * Does not include renaming and linking to GitHub branch.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/merge
 */
export interface BranchUpdatedEvent {
  action: 'branch_updated'
  properties: {
    /**
     * The source of the update action
     */
    source: 'merge_page' | 'out_of_date_notice'
    modifiedEdgeFunctions?: boolean
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a user clicks the review with assistant button for a merge.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/merge
 */
export interface BranchReviewWithAssistantClickedEvent {
  action: 'branch_review_with_assistant_clicked'
  groups: TelemetryGroups
}

/**
 * Triggered when a user selects a branch from the branch selector dropdown.
 *
 * @group Events
 * @source studio
 * @page branch selector (header / sheet / popover)
 */
export interface BranchSelectorBranchClickedEvent {
  action: 'branch_selector_branch_clicked'
  properties: {
    branchId: string
    branchName: string
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a user clicks "Create branch" in the branch selector dropdown.
 *
 * @group Events
 * @source studio
 * @page branch selector (header / sheet / popover)
 */
export interface BranchSelectorCreateClickedEvent {
  action: 'branch_selector_create_clicked'
  groups: TelemetryGroups
}

/**
 * Triggered when a user clicks "Manage branches" in the branch selector dropdown.
 *
 * @group Events
 * @source studio
 * @page branch selector (header / sheet / popover)
 */
export interface BranchSelectorManageClickedEvent {
  action: 'branch_selector_manage_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked on a DPA PDF link to open it.
 *
 * @group Events
 * @source www, studio
 */
export interface DpaPdfOpenedEvent {
  action: 'dpa_pdf_opened'
  properties: {
    /**
     * The source of the click, e.g. www, studio
     */
    source: 'www' | 'studio'
  }
}

/**
 * User clicked on an activity stat in HomeV2.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeActivityStatClickedEvent {
  action: 'home_activity_stat_clicked'
  properties: {
    /**
     * The type of activity stat clicked
     */
    stat_type: 'migrations' | 'backups' | 'branches'
    /**
     * The current value of the stat
     */
    stat_value: number
  }
  groups: TelemetryGroups
}

/**
 * User clicked on a service title in Project Usage section of HomeV2.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeProjectUsageServiceClickedEvent {
  action: 'home_project_usage_service_clicked'
  properties: {
    /**
     * The service that was clicked
     */
    service_type: 'db' | 'functions' | 'auth' | 'storage' | 'realtime'
    /**
     * Total requests for this service
     */
    total_requests: number
    /**
     * Number of errors for this service (optional, only sent when error data is available)
     */
    error_count?: number
  }
  groups: TelemetryGroups
}

/**
 * User clicked on a bar in the usage chart in HomeV2.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeProjectUsageChartClickedEvent {
  action: 'home_project_usage_chart_clicked'
  properties: {
    /**
     * The service type for this chart
     */
    service_type: 'db' | 'functions' | 'auth' | 'storage' | 'realtime'
    /**
     * Timestamp of the bar clicked
     */
    bar_timestamp: string
  }
  groups: TelemetryGroups
}

/**
 * User added a block to the custom report in HomeV2.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeCustomReportBlockAddedEvent {
  action: 'home_custom_report_block_added'
  properties: {
    /**
     * ID of the snippet/block added
     */
    block_id: string
    /**
     * If position is 0 it is equivalent to 'Add your first chart'.
     */
    position: number
  }
  groups: TelemetryGroups
}

/**
 * User removed a block from the custom report in HomeV2.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeCustomReportBlockRemovedEvent {
  action: 'home_custom_report_block_removed'
  properties: {
    /**
     * ID of the block removed
     */
    block_id: string
  }
  groups: TelemetryGroups
}

/**
 * User was exposed to the HomeV2 experiment (shown the new home page).
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeNewExperimentExposedEvent {
  action: 'home_new_experiment_exposed'
  properties: {
    /**
     * The experiment variant shown to the user
     */
    variant: string
  }
  groups: TelemetryGroups
}

/**
 * Connect section was shown to the user on the project homepage.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeConnectSectionExposedEvent {
  action: 'home_connect_section_exposed'
  groups: TelemetryGroups
}

/**
 * User clicked a connect action tile in the Connect section on the project homepage.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeConnectActionClickedEvent {
  action: 'home_connect_action_clicked'
  properties: {
    /**
     * The connect action/tile that was clicked
     */
    mode: 'framework' | 'direct' | 'orm' | 'mcp' | 'api_keys'
  }
  groups: TelemetryGroups
}

/**
 * User opened the ConnectSheet panel.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface ConnectSheetOpenedEvent {
  action: 'connect_sheet_opened'
  properties: {
    /**
     * Where the sheet was opened from
     */
    source: 'header_button' | 'connect_section'
  }
  groups: TelemetryGroups
}

/**
 * User reordered sections in HomeV2 using drag and drop.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}
 */
export interface HomeSectionRowsMovedEvent {
  action: 'home_section_rows_moved'
  properties: {
    /**
     * The section that was moved
     */
    section_moved: string
    /**
     * The old position of the section (0-based index)
     */
    old_position: number
    /**
     * The new position of the section (0-based index)
     */
    new_position: number
  }
  groups: TelemetryGroups
}

/**
 * User clicked the Request DPA button to open the confirmation modal.
 *
 * @group Events
 * @source studio
 * @page /dashboard/org/{slug}/documents
 */
export interface DpaRequestButtonClickedEvent {
  action: 'dpa_request_button_clicked'
}

/**
 * User clicked a document view/download button to access a document.
 *
 * @group Events
 * @source studio
 * @page /dashboard/org/{slug}/documents
 */
export interface DocumentViewButtonClickedEvent {
  action: 'document_view_button_clicked'
  properties: {
    /**
     * The name of the document being viewed, e.g. TIA, SOC2, Standard Security Questionnaire
     */
    documentName: 'TIA' | 'SOC2' | 'ISO27001' | 'Standard Security Questionnaire'
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * User clicked the Request HIPAA button to open the HIPAA request form.
 *
 * @group Events
 * @source studio
 * @page /dashboard/org/{slug}/documents
 */
export interface HipaaRequestButtonClickedEvent {
  action: 'hipaa_request_button_clicked'
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * User successfully created a table in the project.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor or /dashboard/project/{ref}/sql
 */
export interface TableCreatedEvent {
  action: 'table_created'
  properties: {
    /**
     * Method used to create the table
     */
    method: 'sql_editor' | 'table_editor'
    /**
     * Schema where table was created
     */
    schema_name?: string
    /**
     * Name of the table created
     */
    table_name?: string
    /**
     * Whether RLS policies were generated and saved with the table
     */
    has_generated_policies?: boolean
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User successfully added data to a table.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor or /dashboard/project/{ref}/sql
 */
export interface TableDataAddedEvent {
  action: 'table_data_added'
  properties: {
    /**
     * Method used to insert data
     */
    method: 'sql_editor' | 'table_editor' | 'spreadsheet_import'
    /**
     * Schema of the table
     */
    schema_name?: string
    /**
     * Name of the table
     */
    table_name?: string
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User successfully enabled RLS on a table.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor or /dashboard/project/{ref}/sql
 */
export interface TableRLSEnabledEvent {
  action: 'table_rls_enabled'
  properties: {
    /**
     * Method used to enable RLS
     */
    method: 'sql_editor' | 'table_editor'
    /**
     * Schema of the table
     */
    schema_name?: string
    /**
     * Name of the table
     */
    table_name?: string
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the generate policies button in the table editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface RLSGeneratePoliciesClickedEvent {
  action: 'rls_generate_policies_clicked'
  groups: TelemetryGroups
}

/**
 * User removed a generated policy from the table editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface RLSGeneratedPolicyRemovedEvent {
  action: 'rls_generated_policy_removed'
  groups: TelemetryGroups
}

/**
 * User successfully created generated RLS policies for a table.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface RLSGeneratedPoliciesCreatedEvent {
  action: 'rls_generated_policies_created'
  groups: TelemetryGroups
}

/**
 * Conversion event for the generate policies experiment.
 * Fires when a user in the experiment creates a new table via table editor.
 * This is separate from TableCreatedEvent to keep experiment tracking isolated.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface TableCreateGeneratePoliciesExperimentConvertedEvent {
  action: 'table_create_generate_policies_experiment_converted'
  properties: {
    /**
     * Experiment identifier for tracking
     */
    experiment_id: 'tableCreateGeneratePolicies'
    /**
     * Experiment variant: 'control' (feature disabled) or 'variation' (feature enabled)
     */
    variant: 'control' | 'variation'
    /**
     * Whether RLS was enabled on the table
     */
    has_rls_enabled: boolean
    /**
     * Whether the table was created with any RLS policies (manual or generated)
     */
    has_rls_policies: boolean
    /**
     * Whether AI-generated policies were used (only possible in variation)
     */
    has_generated_policies: boolean
  }
  groups: TelemetryGroups
}

/**
 * User was exposed to the generate policies experiment (shown or not shown the Generate Policies button).
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/editor
 */
export interface TableCreateGeneratePoliciesExperimentExposedEvent {
  action: 'table_create_generate_policies_experiment_exposed'
  properties: {
    /**
     * Experiment identifier for tracking
     */
    experiment_id: 'tableCreateGeneratePolicies'
    /**
     * Experiment variant: 'control' (feature disabled) or 'variation' (feature enabled)
     */
    variant: 'control' | 'variation'
    /**
     * Days since project creation (to segment by new user cohorts)
     */
    days_since_project_creation: number
  }
  groups: TelemetryGroups
}

/**
 * User opened API docs panel.
 *
 * @group Events
 * @source studio
 * @page Various pages with API docs button
 */
export interface ApiDocsOpenedEvent {
  action: 'api_docs_opened'
  properties: {
    /**
     * Source of the API docs button click, e.g. table_editor, sidebar
     */
    source: string
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked copy button in API docs panel.
 *
 * @group Events
 * @source studio
 * @page API docs panel
 */
export interface ApiDocsCodeCopyButtonClickedEvent {
  action: 'api_docs_code_copy_button_clicked'
  properties: {
    /**
     * Title of the content being copied
     */
    title?: string
    /**
     * Selected programming language, e.g. js, bash
     */
    selectedLanguage?: string
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User performed a search via the Auth Users page.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/auth/users
 */
export interface AuthUsersSearchSubmittedEvent {
  action: 'auth_users_search_submitted'
  properties: {
    /**
     * The trigger that initiated the search
     */
    trigger:
      | 'search_input'
      | 'refresh_button'
      | 'sort_change'
      | 'provider_filter'
      | 'user_type_filter'
    /**
     * The column being sorted on, e.g. email, phone, created_at, last_sign_in_at
     */
    sort_column: string
    /**
     * The sort order, either ascending or descending
     */
    sort_order: string
    /**
     * The authentication provider(s) being filtered on, e.g. email, phone, google, github
     */
    providers?: string[]
    /**
     * The user role(s) being filtered on, e.g. verified, unverified, anonymous
     */
    user_type?: string
    /**
     * The keywords being searched for
     */
    keywords?: string
    /**
     * The column being filtered on, e.g. email, phone
     * (only included if filtering by a specific column and not all columns)
     */
    filter_column?: string
  }
  groups: TelemetryGroups
}

/**
 * User opened the command menu.
 *
 * @group Events
 * @source studio, docs, www
 * @page any
 */
export interface CommandMenuOpenedEvent {
  action: 'command_menu_opened'
  properties: {
    /**
     * The trigger that opened the command menu
     */
    trigger_type: 'keyboard_shortcut' | 'search_input'
    /**
     * The location where the command menu was opened
     */
    trigger_location?: string
    /**
     * In which app the command input was typed
     */
    app: 'studio' | 'docs' | 'www'
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User typed a search term in the command menu input.
 *
 * @group Events
 * @source studio, docs, www
 * @page any
 */
export interface CommandMenuSearchSubmittedEvent {
  action: 'command_menu_search_submitted'
  properties: {
    /**
     * Search term typed into the command menu input
     */
    value: string
    /**
     * In which app the command input was typed
     */
    app: 'studio' | 'docs' | 'www'
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked a command from the command menu.
 *
 * @group Events
 * @source studio, docs, www
 * @page any
 */
export interface CommandMenuCommandClickedEvent {
  action: 'command_menu_command_clicked'
  properties: {
    /**
     * The clicked command
     */
    command_name: string
    command_value?: string
    command_type: 'action' | 'route'
    /**
     * The search query that was active when the command was clicked
     */
    search_query?: string
    /**
     * The path or URL the clicked item leads to (only present for route commands)
     */
    result_path?: string
    /**
     * In which app the command input was typed
     */
    app: 'studio' | 'docs' | 'www'
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User closed the command menu.
 *
 * @group Events
 * @source studio, docs, www
 * @page any
 */
export interface CommandMenuClosedEvent {
  action: 'command_menu_closed'
  properties: {
    /**
     * In which app the command menu was closed
     */
    app: 'studio' | 'docs' | 'www'
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User opened a sidebar panel.
 *
 * @group Events
 * @source studio
 * @page Various pages with sidebar buttons
 */
export interface SidebarOpenedEvent {
  action: 'sidebar_opened'
  properties: {
    /**
     * The sidebar panel that was opened, e.g. ai-assistant, editor-panel, advisor-panel
     */
    sidebar: 'ai-assistant' | 'editor-panel' | 'advisor-panel' | 'help-panel'
  }
  groups: TelemetryGroups
}

/**
 * User opened an org menu submenu in the mobile navigation sheet.
 *
 * @group Events
 * @source studio
 * @page Organization pages (mobile)
 */
export interface OrgSubmenuOpenedEvent {
  action: 'org_submenu_opened'
  properties: {
    /** The key of the submenu item that was opened */
    itemKey: string
    /** The display label of the submenu item */
    itemLabel: string
  }
  groups: TelemetryGroups
}

/**
 * User clicked the back button in the mobile org menu to return to the top-level menu.
 *
 * @group Events
 * @source studio
 * @page Organization pages (mobile)
 */
export interface OrgMenuBackClickedEvent {
  action: 'org_menu_back_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked a menu item in the mobile org navigation sheet.
 *
 * @group Events
 * @source studio
 * @page Organization pages (mobile)
 */
export interface OrgMenuItemClickedEvent {
  action: 'org_menu_item_clicked'
  properties: {
    /** The key identifying the menu item */
    itemKey: string
    /** The navigation href of the menu item */
    itemHref: string
  }
  groups: TelemetryGroups
}

/**
 * User toggled the inline editor setting in account preferences.
 *
 * @group Events
 * @source studio
 * @page /dashboard/account/preferences
 */
export interface InlineEditorSettingClickedEvent {
  action: 'inline_editor_setting_clicked'
  properties: {
    /**
     * Whether the inline editor was enabled or disabled
     */
    enabled: boolean
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User toggled the queue table operations setting in account preferences.
 *
 * @group Events
 * @source studio
 * @page /dashboard/account/preferences
 */
export interface QueueOperationsSettingClickedEvent {
  action: 'queue_operations_setting_clicked'
  properties: {
    /**
     * Whether the queue operations was enabled or disabled
     */
    enabled: boolean
  }
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the save destination button in add log drains sheet.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/settings/log-drains (LogDrainDestinationSheetForm)
 */
export interface LogDrainSaveButtonClickedEvent {
  action: 'log_drain_save_button_clicked'
  properties: {
    /**
     * Type of the destination saved
     */
    destination:
      | 'postgres'
      | 'bigquery'
      | 'clickhouse'
      | 'webhook'
      | 'datadog'
      | 'elastic'
      | 'loki'
      | 'sentry'
      | 's3'
      | 'axiom'
      | 'last9'
      | 'otlp'
      | 'syslog'
  }
  groups: TelemetryGroups
}

/**
 * User confirmed addition of log drain destination.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/settings/log-drains (LogDrains)
 */
export interface LogDrainConfirmButtonSubmittedEvent {
  action: 'log_drain_confirm_button_submitted'
  properties: {
    /**
     * Type of the destination confirmed
     */
    destination:
      | 'postgres'
      | 'bigquery'
      | 'clickhouse'
      | 'webhook'
      | 'datadog'
      | 'elastic'
      | 'loki'
      | 'sentry'
      | 's3'
      | 'axiom'
      | 'last9'
      | 'otlp'
      | 'syslog'
  }
  groups: TelemetryGroups
}

type AdvisorCategory = 'PERFORMANCE' | 'SECURITY'
type AdvisorLevel = 'ERROR' | 'WARN' | 'INFO'

/**
 * User opened an advisor detail page to view a specific advisor (lint, notification, or signal).
 * This tracks when users engage with advisor recommendations.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/advisors/security or home page or advisor panel sidebar
 */
export interface AdvisorDetailOpenedEvent {
  action: 'advisor_detail_opened'
  properties: {
    /**
     * Where the advisor was viewed from
     */
    origin: 'homepage' | 'advisor_panel' | 'advisors_page'
    /**
     * Source of the advisor
     */
    advisorSource: 'lint' | 'notification' | 'signal'
    /**
     * Category of the advisor (SECURITY or PERFORMANCE)
     */
    advisorCategory?: AdvisorCategory
    /**
     * Specific advisor type/name, e.g. missing_index, no_rls_policy
     */
    advisorType?: string
    /**
     * Severity level of the advisor (only for lints)
     */
    advisorLevel?: AdvisorLevel
  }
  groups: TelemetryGroups
}

/**
 * User clicked the Assistant button to get AI help with an advisor issue.
 * This opens the AI Assistant sidebar with a pre-filled prompt about the issue.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref} (homepage), /dashboard/project/{ref}/advisors/security or /dashboard/project/{ref}/advisors/performance (lint detail panel)
 */
export interface AdvisorAssistantButtonClickedEvent {
  action: 'advisor_assistant_button_clicked'
  properties: {
    /**
     * Where the button was clicked
     */
    origin: 'homepage' | 'lint_detail'
    /**
     * Category of the advisor (SECURITY or PERFORMANCE)
     */
    advisorCategory?: AdvisorCategory
    /**
     * Specific advisor type/name
     */
    advisorType?: string
    /**
     * Severity level of the advisor (only for lints)
     */
    advisorLevel?: AdvisorLevel
    /**
     * Number of issues found (only included when origin is 'homepage')
     */
    issuesCount?: number
  }
  groups: TelemetryGroups
}

/**
 * User clicked on "Explain with AI" button in Query Performance detail panel
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/observability/query-performance
 */
export interface QueryPerformanceAIExplanationButtonClickedEvent {
  action: 'query_performance_explain_with_ai_button_clicked'
  groups: TelemetryGroups
}

/**
 * Source/location where AI assistant actions originate from.
 */
export type AiAssistantSource =
  | 'explain_visualizer'
  | 'query_performance'
  | 'sql_debug'
  | 'lint_detail'
  | 'advisor_section'
  | 'advisor_widget'
  | 'branch_review'
  | 'log_explorer'
  | 'error_code'
  | 'advisor_signal_detail'

/**
 * User copied an AI prompt to clipboard instead of using the built-in assistant.
 * This allows users to paste the prompt into external AI tools (Cursor, Claude, etc.)
 *
 * @group Events
 * @source studio
 */
export interface AiPromptCopiedEvent {
  action: 'ai_prompt_copied'
  properties: {
    /**
     * Source/location where the prompt was copied from
     */
    source: AiAssistantSource
  }
  groups: TelemetryGroups
}

/**
 * User clicked the main AI assistant button in the dropdown.
 *
 * @group Events
 * @source studio
 */
export interface AiAssistantDropdownButtonClickedEvent {
  action: 'ai_assistant_dropdown_button_clicked'
  properties: {
    /**
     * Source/location where the button was clicked
     */
    source: AiAssistantSource
  }
  groups: TelemetryGroups
}

/**
 * User clicked an external AI tool link (ChatGPT or Claude) in the dropdown.
 *
 * @group Events
 * @source studio
 */
export interface AiExternalToolClickedEvent {
  action: 'ai_external_tool_clicked'
  properties: {
    /**
     * Source/location where the link was clicked
     */
    source: AiAssistantSource
    /**
     * Which external AI tool was selected
     */
    tool: 'chatgpt' | 'claude'
  }
  groups: TelemetryGroups
}

/**
 * User clicked a CTA in the project security gate.
 *
 * @group Events
 * @source studio
 */
export interface ProjectSecurityCtaClickedEvent {
  action: 'project_security_cta_clicked'
  properties: {
    type: 'ask_assistant' | 'copy_prompt' | 'skip_to_home' | 'view_policies'
    schema?: string
    tableName?: string
  }
  groups: TelemetryGroups
}

/**
 * User opened the request upgrade modal (for users without billing permissions).
 *
 * @group Events
 * @source studio
 */
export interface RequestUpgradeModalOpenedEvent {
  action: 'request_upgrade_modal_opened'
  properties: {
    /** Target plan being requested */
    requestedPlan: 'Pro' | 'Team' | 'Enterprise'
    /** Addon being requested, if applicable */
    addon?: 'pitr' | 'customDomain' | 'ipv4' | 'spendCap' | 'computeSize'
    /** Current organization plan */
    currentPlan?: string
    /** Feature context driving the upgrade request */
    featureProposition?: string
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * User submitted a request upgrade form to billing owners.
 *
 * @group Events
 * @source studio
 */
export interface RequestUpgradeSubmittedEvent {
  action: 'request_upgrade_submitted'
  properties: {
    /** Target plan being requested */
    requestedPlan: 'Pro' | 'Team' | 'Enterprise'
    /** Addon being requested, if applicable */
    addon?: 'pitr' | 'customDomain' | 'ipv4' | 'spendCap' | 'computeSize'
    /** Current organization plan */
    currentPlan?: string
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * Triggered when a Studio error UI element is displayed (mounted).
 * This includes error Admonitions, Toast notifications, and ErrorDisplay components.
 *
 * @group Events
 * @source studio
 */
export interface DashboardErrorCreatedEvent {
  action: 'dashboard_error_created'
  properties: {
    /**
     * Source of the error
     */
    source?: 'admonition' | 'toast' | 'error_display'
    /**
     * Type of error matched (for error_display source)
     */
    errorType?: string
    /**
     * Whether troubleshooting steps are available (for error_display source)
     */
    hasTroubleshooting?: boolean
  }
  groups: TelemetryGroups
}

/**
 * Triggered when the inline error troubleshooter is shown to the user.
 *
 * @group Events
 * @source studio
 */
export interface InlineErrorTroubleshooterExposedEvent {
  action: 'inline_error_troubleshooter_exposed'
  properties: {
    /** ID of the matched error mapping */
    errorType: string
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a user opens or closes a troubleshooting accordion step.
 *
 * @group Events
 * @source studio
 */
export interface InlineErrorTroubleshooterStepClickedEvent {
  action: 'inline_error_troubleshooter_step_clicked'
  properties: {
    /** ID of the matched error mapping */
    errorType: string
    /** Step number that was clicked (1, 2, 3, ...) — null when a step is collapsed */
    step: number | null
    /** Title of the step that was clicked */
    stepTitle?: string
    /** Whether the step was opened (true) or closed (false) */
    expanded: boolean
  }
  groups: TelemetryGroups
}

/**
 * Triggered when a user clicks an action within the inline error troubleshooter.
 * Covers all CTAs including the contact support link.
 *
 * @group Events
 * @source studio
 */
export interface InlineErrorTroubleshooterActionClickedEvent {
  action: 'inline_error_troubleshooter_action_clicked'
  properties: {
    /** ID of the matched error mapping */
    errorType: string
    /** Which CTA was clicked */
    ctaType: 'restart_db' | 'troubleshooting_guide' | 'ask_ai' | 'contact_support'
  }
  groups: TelemetryGroups
}

/**
 * User successfully completed installing an integration via the integrations marketplace in the dashboard.
 * Note: This excludes Wrappers and Postgres Extensions. Previously: integration_installed
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/{integration_slug}
 */
export interface IntegrationInstallCompletedEvent {
  action: 'integration_install_completed'
  properties: {
    /**
     * The name of the integration installed
     */
    integrationName: string
  }
  groups: TelemetryGroups
}

/**
 * User submitted an integration install via the integrations marketplace. Previously: integration_install_started
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/{integration_slug}
 */
export interface IntegrationInstallSubmittedEvent {
  action: 'integration_install_submitted'
  properties: {
    /** The name of the integration being installed */
    integrationName: string
    /** The integration method (will be 'template' for frontend-driven integrations.) */
    method: string
  }
  groups: TelemetryGroups
}

/**
 * User submitted an integration uninstall via the integrations marketplace. Previously: integration_uninstall_started
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/{integration_slug}
 */
export interface IntegrationUninstallSubmittedEvent {
  action: 'integration_uninstall_submitted'
  properties: {
    /**
     * The name of the integration being uninstalled
     */
    integrationName: string
  }
  groups: TelemetryGroups
}

/**
 * Installation failed for an integration.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/{integration_slug}
 */
export interface IntegrationInstallFailedEvent {
  action: 'integration_install_failed'
  properties: {
    /**
     * The name of the integration whose installation failed
     */
    integrationName: string
  }
  groups: TelemetryGroups
}

/**
 * User successfully completed uninstalling an integration via the integrations marketplace in the dashboard.
 * Note: This excludes Wrappers and Postgres Extensions. Previously: integration_uninstalled
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/{integration_slug}
 */
export interface IntegrationUninstallCompletedEvent {
  action: 'integration_uninstall_completed'
  properties: {
    /**
     * The name of the integration installed
     */
    integrationName: string
  }
  groups: TelemetryGroups
}

/**
 * User clicked the enable Create rls_ensure trigger button in the RLS Event Trigger banner.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}/auth/policies
 */
export interface RlsEventTriggerBannerCreateButtonClickedEvent {
  action: 'rls_event_trigger_banner_create_button_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the Run button in the log explorer.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}/logs/explorer
 */
export interface LogExplorerQueryRunButtonClickedEvent {
  action: 'log_explorer_query_run_button_clicked'
  properties: {
    /**
     * Whether the user is editing a saved query
     */
    is_saved_query: boolean
  }
  groups: TelemetryGroups
}

/**
 * User clicked an upgrade CTA inside the compute badge hover card.
 *
 * @group Events
 * @source studio
 */
export interface ComputeBadgeUpgradeClickedEvent {
  action: 'compute_badge_upgrade_clicked'
  properties: {
    computeSize: string
    planId: string
    upgradeType: 'pro_upgrade' | 'free_micro_upgrade' | 'compute_upgrade'
  }
  groups: TelemetryGroups
}

/**
 * User dismissed the free Micro upgrade banner.
 *
 * @group Events
 * @source studio
 */
export interface FreeMicroUpgradeBannerDismissedEvent {
  action: 'free_micro_upgrade_banner_dismissed'
  groups: TelemetryGroups
}

/**
 * User clicked the CTA on the free Micro upgrade banner.
 *
 * @group Events
 * @source studio
 */
export interface FreeMicroUpgradeBannerCtaClickedEvent {
  action: 'free_micro_upgrade_banner_cta_clicked'
  groups: TelemetryGroups
}

/**
 * User clicked the Navigate action in the storage explorer header.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}/storage/files/buckets/{bucketId}
 */
export interface StorageExplorerNavigateClickedEvent {
  action: 'storage_explorer_navigate_clicked'
  groups: TelemetryGroups
}

/**
 * User submitted a folder path from the storage explorer Navigate action.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}/storage/files/buckets/{bucketId}
 */
export interface StorageExplorerNavigateSubmittedEvent {
  action: 'storage_explorer_navigate_submitted'
  groups: TelemetryGroups
}

/**
 * User clicked the Remove policy button on the public bucket SELECT policy warning.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}/storage/files/buckets/{bucketId}
 */
export interface StoragePublicBucketSelectPolicyRemovedEvent {
  action: 'storage_public_bucket_select_policy_removed'
  properties: {
    /** The ID of the bucket whose SELECT policy was removed */
    bucketId: string
  }
  groups: TelemetryGroups
}

/**
 * User dismissed the public bucket SELECT policy warning banner.
 *
 * @group Events
 * @source studio
 * @page /project/{ref}/storage/files/buckets/{bucketId}
 */
export interface StoragePublicBucketSelectPolicyWarningDismissButtonClickedEvent {
  action: 'storage_public_bucket_select_policy_warning_dismiss_button_clicked'
  properties: {
    /** The ID of the bucket whose warning was dismissed */
    bucketId: string
  }
  groups: TelemetryGroups
}

/**
 * Triggered when an access token is successfully created.
 *
 * @group Events
 * @source studio
 * @page /account/tokens
 */
export interface AccessTokenCreatedEvent {
  action: 'access_token_created'
  properties: {
    tokenType: 'classic' | 'scoped'
    expiryPreset: string
    resourceAccess?: 'all-orgs' | 'selected-orgs' | 'selected-projects'
    permissionCount?: number
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * Triggered when an access token is successfully deleted.
 *
 * @group Events
 * @source studio
 * @page /account/tokens
 */
export interface AccessTokenRemovedEvent {
  action: 'access_token_removed'
  properties: {
    tokenType: 'classic' | 'scoped'
  }
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * User clicked the "Upgrade to Pro" CTA in the dashboard header.
 * GROWTH-615: always-visible upgrade button in dashboard header for free-plan users.
 *
 * @group Events
 * @source studio
 */
export interface HeaderUpgradeCtaClickedEvent {
  action: 'header_upgrade_cta_clicked'
  groups: Omit<TelemetryGroups, 'project'>
}

/**
 * User clicked the primary CTA on a resource exhaustion warning banner.
 *
 * @group Events
 * @source studio
 */
export interface ResourceExhaustionBannerUpgradeClickedEvent {
  action: 'resource_exhaustion_banner_upgrade_clicked'
  groups: TelemetryGroups
  properties: {
    warningTypes: string[]
    destination: string
  }
}

/**
 * User clicked "Ask AI Assistant" on a resource exhaustion warning banner.
 *
 * @group Events
 * @source studio
 */
export interface ResourceExhaustionBannerAiAssistantClickedEvent {
  action: 'resource_exhaustion_banner_ai_assistant_clicked'
  groups: TelemetryGroups
  properties: {
    warningTypes: string[]
  }
}

/**
 * User clicked a row in the Unified Logs interface.
 *
 * @group Events
 * @source studio
 */
export interface UnifiedLogsRowClickedEvent {
  action: 'unified_logs_row_clicked'
  properties: {
    logType: string
  }
  groups: TelemetryGroups
}

/**
 * User clicked the Supabase logo in the top-left corner of the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderHomeLogoClickedEvent {
  action: 'header_home_logo_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the mobile back-to-dashboard chevron in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderBackToDashboardClickedEvent {
  action: 'header_back_to_dashboard_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the "Exceeding usage limits" badge in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderExceedingUsageBadgeClickedEvent {
  action: 'header_exceeding_usage_badge_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User opened the organization dropdown in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderOrganizationDropdownOpenedEvent {
  action: 'header_organization_dropdown_opened'
  groups: Partial<TelemetryGroups>
}

/**
 * User opened the project dropdown in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderProjectDropdownOpenedEvent {
  action: 'header_project_dropdown_opened'
  groups: Partial<TelemetryGroups>
}

/**
 * User opened the branch dropdown in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderBranchDropdownOpenedEvent {
  action: 'header_branch_dropdown_opened'
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the merge-request trigger button in the page header.
 * Fires on click; the existing branch_create_merge_request_button_clicked
 * fires only on successful merge-request creation.
 *
 * @group Events
 * @source studio
 */
export interface HeaderMergeRequestButtonClickedEvent {
  action: 'header_merge_request_button_clicked'
  properties: {
    /** Whether a review has already been requested for this branch. */
    hasReviewRequested: boolean
  }
  groups: TelemetryGroups
}

/**
 * User clicked the "Connect" button in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderConnectButtonClickedEvent {
  action: 'header_connect_button_clicked'
  groups: TelemetryGroups
}

/**
 * User opened the feedback dropdown in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderFeedbackDropdownOpenedEvent {
  action: 'header_feedback_dropdown_opened'
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the Advisor Center toggle button in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderAdvisorButtonClickedEvent {
  action: 'header_advisor_button_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the Inline SQL Editor toggle button in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderInlineEditorButtonClickedEvent {
  action: 'header_inline_editor_button_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User clicked the AI Assistant toggle button in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderAssistantButtonClickedEvent {
  action: 'header_assistant_button_clicked'
  groups: Partial<TelemetryGroups>
}

/**
 * User opened the user/account dropdown in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderUserDropdownOpenedEvent {
  action: 'header_user_dropdown_opened'
  groups: Partial<TelemetryGroups>
}

/**
 * User opened the local-development settings dropdown in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderLocalDropdownOpenedEvent {
  action: 'header_local_dropdown_opened'
  groups: Partial<TelemetryGroups>
}

/**
 * User opened the local CLI version popover in the page header.
 *
 * @group Events
 * @source studio
 */
export interface HeaderLocalVersionPopoverOpenedEvent {
  action: 'header_local_version_popover_opened'
  groups: Partial<TelemetryGroups>
}

/**
 * @hidden
 */
export type TelemetryEvent =
  | SignUpEvent
  | SignInEvent
  | ConnectionStringCopiedEvent
  | McpInstallButtonClickedEvent
  | ApiDocsOpenedEvent
  | ApiDocsCodeCopyButtonClickedEvent
  | CronJobCreatedEvent
  | CronJobUpdatedEvent
  | CronJobRemovedEvent
  | CronJobCreateClickedEvent
  | CronJobUpdateClickedEvent
  | CronJobDeleteClickedEvent
  | CronJobHistoryClickedEvent
  | FeaturePreviewEnabledEvent
  | FeaturePreviewDisabledEvent
  | TimezonePickerClickedEvent
  | ProjectCreationRlsOptionExperimentExposedEvent
  | ProjectCreationDefaultPrivilegesExposedEvent
  | ProjectCreationSimpleVersionSubmittedEvent
  | ProjectCreationSimpleVersionConfirmModalOpenedEvent
  | TableApiAccessToggleClickedEvent
  | ProjectCreationInitialStepPromptIntendedEvent
  | ProjectCreationInitialStepSubmittedEvent
  | ProjectCreationSecondStepPromptIntendedEvent
  | ProjectCreationSecondStepSubmittedEvent
  | RealtimeInspectorListenChannelClickedEvent
  | RealtimeInspectorBroadcastSentEvent
  | RealtimeInspectorMessageClickedEvent
  | RealtimeInspectorCopyMessageClickedEvent
  | RealtimeInspectorFiltersAppliedEvent
  | RealtimeInspectorDatabaseRoleUpdatedEvent
  | RealtimeToggleTableClickedEvent
  | TableRealtimeEnabledEvent
  | TableRealtimeDisabledEvent
  | SqlEditorQuickstartClickedEvent
  | SqlEditorTemplateClickedEvent
  | SqlEditorResultDownloadCsvClickedEvent
  | SqlEditorResultCopyMarkdownClickedEvent
  | SqlEditorResultCopyJsonClickedEvent
  | SqlEditorResultCopyCsvClickedEvent
  | AssistantPromptSubmittedEvent
  | AssistantDebugSubmittedEvent
  | AssistantSuggestionRunQueryClickedEvent
  | AssistantSqlDiffHandlerEvaluatedEvent
  | AssistantEditInSqlEditorClickedEvent
  | AssistantMessageRatingSubmittedEvent
  | DocsFeedbackClickedEvent
  | CopyAsMarkdownEvent
  | AskAIEvent
  | HomepageFrameworkQuickstartClickedEvent
  | HomepageProductCardClickedEvent
  | WwwPricingPlanCtaClickedEvent
  | EventPageCtaClickedEvent
  | HomepageGitHubButtonClickedEvent
  | HomepageDiscordButtonClickedEvent
  | HomepageCustomerStoryCardClickedEvent
  | HomepageProjectTemplateCardClickedEvent
  | CustomReportAddSQLBlockClickedEvent
  | CustomReportAssistantSQLBlockAddedEvent
  | OpenSourceRepoCardClickedEvent
  | StartProjectButtonClickedEvent
  | SeeDocumentationButtonClickedEvent
  | RequestDemoButtonClickedEvent
  | RegisterStateOfStartups2025NewsletterClicked
  | SignInButtonClickedEvent
  | HelpButtonClickedEvent
  | ExampleProjectCardClickedEvent
  | ImportDataButtonClickedEvent
  | ImportDataFileDroppedEvent
  | ImportDataAddedEvent
  | SendFeedbackButtonClickedEvent
  | SqlEditorQueryRunButtonClickedEvent
  | LogExplorerQueryRunButtonClickedEvent
  | StorageExplorerNavigateClickedEvent
  | StorageExplorerNavigateSubmittedEvent
  | StoragePublicBucketSelectPolicyRemovedEvent
  | StoragePublicBucketSelectPolicyWarningDismissButtonClickedEvent
  | StudioPricingPlanCtaClickedEvent
  | StudioPricingSidePanelOpenedEvent
  | ReportsDatabaseGrafanaBannerClickedEvent
  | MetricsAPIBannerCtaButtonClickedEvent
  | MetricsAPIBannerDismissButtonClickedEvent
  | IndexAdvisorBannerEnableButtonClickedEvent
  | IndexAdvisorBannerDismissButtonClickedEvent
  | IndexAdvisorDialogEnableButtonClickedEvent
  | IndexAdvisorTabClickedEvent
  | IndexAdvisorCreateIndexesButtonClickedEvent
  | EdgeFunctionDeployButtonClickedEvent
  | EdgeFunctionDeployUpdatesConfirmClickedEvent
  | EdgeFunctionAiAssistantButtonClickedEvent
  | EdgeFunctionViaEditorButtonClickedEvent
  | EdgeFunctionTemplateClickedEvent
  | EdgeFunctionViaCliButtonClickedEvent
  | EdgeFunctionDeployUpdatesButtonClickedEvent
  | EdgeFunctionTestSendButtonClickedEvent
  | EdgeFunctionTestSidePanelOpenedEvent
  | SupabaseUiCommandCopyButtonClickedEvent
  | SupportTicketSubmittedEvent
  | AiAssistantInSupportFormClickedEvent
  | OrganizationMfaEnforcementUpdatedEvent
  | ForeignDataWrapperCreatedEvent
  | StorageBucketCreatedEvent
  | BranchCreateButtonClickedEvent
  | BranchDeleteButtonClickedEvent
  | BranchCreateMergeRequestButtonClickedEvent
  | BranchCloseMergeRequestButtonClickedEvent
  | BranchMergeSubmittedEvent
  | BranchMergeCompletedEvent
  | BranchMergeFailedEvent
  | BranchUpdatedEvent
  | BranchReviewWithAssistantClickedEvent
  | BranchSelectorBranchClickedEvent
  | BranchSelectorCreateClickedEvent
  | BranchSelectorManageClickedEvent
  | DpaPdfOpenedEvent
  | HomeNewExperimentExposedEvent
  | HomeConnectSectionExposedEvent
  | HomeConnectActionClickedEvent
  | ConnectSheetOpenedEvent
  | HomeSectionRowsMovedEvent
  | HomeActivityStatClickedEvent
  | HomeProjectUsageServiceClickedEvent
  | HomeProjectUsageChartClickedEvent
  | HomeCustomReportBlockAddedEvent
  | HomeCustomReportBlockRemovedEvent
  | DpaRequestButtonClickedEvent
  | DocumentViewButtonClickedEvent
  | HipaaRequestButtonClickedEvent
  | TableCreatedEvent
  | TableDataAddedEvent
  | TableRLSEnabledEvent
  | RLSGeneratePoliciesClickedEvent
  | RLSGeneratedPolicyRemovedEvent
  | RLSGeneratedPoliciesCreatedEvent
  | TableCreateGeneratePoliciesExperimentExposedEvent
  | TableCreateGeneratePoliciesExperimentConvertedEvent
  | AuthUsersSearchSubmittedEvent
  | CommandMenuOpenedEvent
  | CommandMenuClosedEvent
  | CommandMenuSearchSubmittedEvent
  | CommandMenuCommandClickedEvent
  | InlineEditorSettingClickedEvent
  | QueueOperationsSettingClickedEvent
  | SidebarOpenedEvent
  | LogDrainSaveButtonClickedEvent
  | LogDrainConfirmButtonSubmittedEvent
  | AdvisorDetailOpenedEvent
  | AdvisorAssistantButtonClickedEvent
  | QueryPerformanceAIExplanationButtonClickedEvent
  | AiPromptCopiedEvent
  | AiAssistantDropdownButtonClickedEvent
  | AiExternalToolClickedEvent
  | ProjectSecurityCtaClickedEvent
  | RequestUpgradeModalOpenedEvent
  | RequestUpgradeSubmittedEvent
  | DashboardErrorCreatedEvent
  | InlineErrorTroubleshooterExposedEvent
  | InlineErrorTroubleshooterStepClickedEvent
  | InlineErrorTroubleshooterActionClickedEvent
  | IntegrationInstallCompletedEvent
  | IntegrationInstallSubmittedEvent
  | IntegrationUninstallSubmittedEvent
  | IntegrationInstallFailedEvent
  | IntegrationUninstallCompletedEvent
  | RlsEventTriggerBannerCreateButtonClickedEvent
  | OrgSubmenuOpenedEvent
  | OrgMenuBackClickedEvent
  | OrgMenuItemClickedEvent
  | ComputeBadgeUpgradeClickedEvent
  | FreeMicroUpgradeBannerDismissedEvent
  | FreeMicroUpgradeBannerCtaClickedEvent
  | HeaderUpgradeCtaClickedEvent
  | AccessTokenCreatedEvent
  | AccessTokenRemovedEvent
  | ResourceExhaustionBannerUpgradeClickedEvent
  | ResourceExhaustionBannerAiAssistantClickedEvent
  | UnifiedLogsRowClickedEvent
  | HeaderHomeLogoClickedEvent
  | HeaderBackToDashboardClickedEvent
  | HeaderExceedingUsageBadgeClickedEvent
  | HeaderOrganizationDropdownOpenedEvent
  | HeaderProjectDropdownOpenedEvent
  | HeaderBranchDropdownOpenedEvent
  | HeaderMergeRequestButtonClickedEvent
  | HeaderConnectButtonClickedEvent
  | HeaderFeedbackDropdownOpenedEvent
  | HeaderAdvisorButtonClickedEvent
  | HeaderInlineEditorButtonClickedEvent
  | HeaderAssistantButtonClickedEvent
  | HeaderUserDropdownOpenedEvent
  | HeaderLocalDropdownOpenedEvent
  | HeaderLocalVersionPopoverOpenedEvent
