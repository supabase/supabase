/**
 * Consolidated event definitions coming from the frontend, including studio, www, and docs.
 *
 * Note that events are not emitted for users that have opted out of telemetry.
 *
 * Original definitions located at:
 * https://github.com/supabase/supabase/blob/master/packages/common/telemetry-constants.ts
 *
 * @module telemetry-frontend
 */

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
 * Triggered when a user signs in with Github, Email and Password or SSO.
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
     * Method selected by user, e.g. URI, PSQL, SQLAlchemy, etc.
     */
    connectionType: string
    /**
     * Language of the code block if selected, e.g. bash, go
     */
    lang: string
    /**
     * Connection Method, e.g. direct, transaction_pooler, session_pooler
     */
    connectionMethod: 'direct' | 'transaction_pooler' | 'session_pooler'
  }
  groups: {
    project: string
    organization: string
  }
}

/**
 * Cron job created.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs?dialog-shown=true
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
  groups: {
    project: string
    organization: string
  }
}

/**
 * Cron job updated.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs?dialog-shown=true
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
  groups: {
    project: string
    organization: string
  }
}

/**
 * Cron job deleted.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobDeletedEvent {
  action: 'cron_job_deleted'
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
}

/**
 * The FeaturePreviewModal was opened.
 *
 * The FeaturePreviewModal can be opened clicking at the profile icon at the bottom left corner of the project sidebar.
 *
 * @group Events
 * @source studio
 */
export interface FeaturePreviewsClickedEvent {
  action: 'feature_previews_clicked'
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
}

/**
 * Existing project creation form was submitted and the project was created.
 *
 * @group Events
 * @source studio
 * @page new/{slug}
 */
export interface ProjectCreationSimpleVersionSubmittedEvent {
  action: 'project_creation_simple_version_submitted'
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
}

/**
 * User submitted a prompt to the assistant sidebar.
 *
 * @group Events
 * @source studio
 */
export interface AssistantPromptSubmittedEvent {
  action: 'assistant_prompt_submitted'
  groups: {
    project: string
    organization: string
  }
}

/**
 * User submitted a debug request to the assistant sidebar or prompt submitted has Help me to debug.
 *
 * @group Events
 * @source studio
 */
export interface AssistantDebugSubmittedEvent {
  action: 'assistant_debug_submitted'
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
}

/**
 * User clicked on Add block -> SQL Snippets -> a SQL snippet in a custom reports page.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/reports/{id}
 */
export interface CustomReportAddSQLBlockClicked {
  action: 'custom_report_add_sql_block_clicked'
}

/**
 * User dragged and dropped a SQL block from the Assistant Panel into the custom report while on a custom report page.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/reports/{id}
 */
export interface CustomReportAssistantSQLBlockAdded {
  action: 'custom_report_assistant_sql_block_added'
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
 * User clicked the GitHub Discussions button in the homepage community section.
 *
 * @group Events
 * @source www
 * @page /
 */
export interface HomepageGitHubDiscussionsButtonClickedEvent {
  action: 'homepage_github_discussions_button_clicked'
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
  groups: {
    project?: string
    organization?: string
  }
}

/**
 * User clicked the "Send Feedback" button in the top right corner of the page header.
 *
 * @group Events
 * @source studio
 */
export interface SendFeedbackButtonClickedEvent {
  action: 'send_feedback_button_clicked'
  groups: {
    project?: string
    organization?: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: {
    project: string
    organization: string
  }
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
  groups: { organization: string }
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
  groups: { organization: string }
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
  groups: {
    project: string
    organization: string
  }
}

/**
 * @hidden
 */
export type TelemetryEvent =
  | SignUpEvent
  | SignInEvent
  | ConnectionStringCopiedEvent
  | CronJobCreatedEvent
  | CronJobUpdatedEvent
  | CronJobDeletedEvent
  | CronJobCreateClickedEvent
  | CronJobUpdateClickedEvent
  | CronJobDeleteClickedEvent
  | CronJobHistoryClickedEvent
  | FeaturePreviewsClickedEvent
  | FeaturePreviewEnabledEvent
  | FeaturePreviewDisabledEvent
  | ProjectCreationSimpleVersionSubmittedEvent
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
  | SqlEditorQuickstartClickedEvent
  | SqlEditorTemplateClickedEvent
  | SqlEditorResultDownloadCsvClickedEvent
  | SqlEditorResultCopyMarkdownClickedEvent
  | SqlEditorResultCopyJsonClickedEvent
  | AssistantPromptSubmittedEvent
  | AssistantDebugSubmittedEvent
  | AssistantSuggestionRunQueryClickedEvent
  | AssistantSqlDiffHandlerEvaluatedEvent
  | AssistantEditInSqlEditorClickedEvent
  | DocsFeedbackClickedEvent
  | HomepageFrameworkQuickstartClickedEvent
  | HomepageProductCardClickedEvent
  | WwwPricingPlanCtaClickedEvent
  | EventPageCtaClickedEvent
  | HomepageGitHubButtonClickedEvent
  | HomepageGitHubDiscussionsButtonClickedEvent
  | HomepageDiscordButtonClickedEvent
  | HomepageCustomerStoryCardClickedEvent
  | HomepageProjectTemplateCardClickedEvent
  | CustomReportAddSQLBlockClicked
  | CustomReportAssistantSQLBlockAdded
  | OpenSourceRepoCardClickedEvent
  | StartProjectButtonClickedEvent
  | SeeDocumentationButtonClickedEvent
  | RequestDemoButtonClickedEvent
  | SignInButtonClickedEvent
  | HelpButtonClickedEvent
  | ExampleProjectCardClickedEvent
  | ImportDataButtonClickedEvent
  | ImportDataAddedEvent
  | SendFeedbackButtonClickedEvent
  | SqlEditorQueryRunButtonClickedEvent
  | StudioPricingPlanCtaClickedEvent
  | StudioPricingSidePanelOpenedEvent
  | ReportsDatabaseGrafanaBannerClickedEvent
