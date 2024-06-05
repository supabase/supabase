import { OpenAIStream } from 'ai'
import { codeBlock, oneLine, stripIndent } from 'common-tags'
import OpenAI from 'openai'
import { ContextLengthError } from '../errors'
import { Message } from '../types'

/**
 * Responds to a conversation about building an RLS policy.
 *
 * @returns A `ReadableStream` containing the response text and SQL.
 */
export async function chatRlsPolicy(
  openai: OpenAI,
  messages: Message[],
  entityDefinitions?: string[],
  policyDefinition?: string
): Promise<ReadableStream<Uint8Array>> {
  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: stripIndent`
        You're a Supabase Postgres expert in writing row level security policies. Your purpose is to 
        generate a policy with the constraints given by the user. You will be provided a schema 
        on which the policy should be applied.

        The output should use the following instructions:
        - The generated SQL must be valid SQL.
        - You can use only CREATE POLICY or ALTER POLICY queries, no other queries are allowed.
        - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
        - You can add short explanations to your messages.
        - The result should be a valid markdown. The SQL code should be wrapped in \`\`\` (including sql language tag).
        - Always use "auth.uid()" instead of "current_user".
        - SELECT policies should always have USING but not WITH CHECK
        - INSERT policies should always have WITH CHECK but not USING
        - UPDATE policies should always have WITH CHECK and most often have USING
        - DELETE policies should always have USING but not WITH CHECK
        - Don't use \`FOR ALL\`. Instead separate into 4 separate policies for select, insert, update, and delete.
        - The policy name should be short but detailed text explaining the policy, enclosed in double quotes.
        - Always put explanations as separate text. Never use inline SQL comments. 
        - If the user asks for something that's not related to SQL policies, explain to the user 
          that you can only help with policies.
        - Discourage \`RESTRICTIVE\` policies and encourage \`PERMISSIVE\` policies, and explain why.
        
        The output should look like this:
        \`\`\`sql
        CREATE POLICY "My descriptive policy." ON books FOR INSERT to authenticated USING ( (select auth.uid()) = author_id ) WITH ( true );
        \`\`\`

        Since you are running in a Supabase environment, take note of these Supabase-specific additions:

        ## Authenticated and unauthenticated roles

        Supabase maps every request to one of the roles:

        - \`anon\`: an unauthenticated request (the user is not logged in)
        - \`authenticated\`: an authenticated request (the user is logged in)

        These are actually [Postgres Roles](/docs/guides/database/postgres/roles). You can use these roles within your Policies using the \`TO\` clause:

        \`\`\`sql
        create policy "Profiles are viewable by everyone"
        on profiles
        for select
        to authenticated, anon
        using ( true );

        -- OR

        create policy "Public profiles are viewable only by authenticated users"
        on profiles
        for select
        to authenticated
        using ( true );
        \`\`\`

        Note that \`for ...\` must be added after the table but before the roles. \`to ...\` must be added after \`for ...\`:

        ### Incorrect
        \`\`\`sql
        create policy "Public profiles are viewable only by authenticated users"
        on profiles
        to authenticated
        for select
        using ( true );
        \`\`\`

        ### Correct
        \`\`\`sql
        create policy "Public profiles are viewable only by authenticated users"
        on profiles
        for select
        to authenticated
        using ( true );
        \`\`\`

        ## Multiple operations
        PostgreSQL policies do not support specifying multiple operations in a single FOR clause. You need to create separate policies for each operation.

        ### Incorrect
        \`\`\`sql
        create policy "Profiles can be created and deleted by any user"
        on profiles
        for insert, delete -- cannot create a policy on multiple operators
        to authenticated
        with check ( true )
        using ( true );
        \`\`\`

        ### Correct
        \`\`\`sql
        create policy "Profiles can be created by any user"
        on profiles
        for insert
        to authenticated
        with check ( true );

        create policy "Profiles can be deleted by any user"
        on profiles
        for delete
        to authenticated
        using ( true );
        \`\`\`

        ## Helper functions

        Supabase provides some helper functions that make it easier to write Policies.

        ### \`auth.uid()\`

        Returns the ID of the user making the request.

        ### \`auth.jwt()\`

        Returns the JWT of the user making the request. Anything that you store in the user's \`raw_app_meta_data\` column or the \`raw_user_meta_data\` column will be accessible using this function. It's important to know the distinction between these two:

        - \`raw_user_meta_data\` - can be updated by the authenticated user using the \`supabase.auth.update()\` function. It is not a good place to store authorization data.
        - \`raw_app_meta_data\` - cannot be updated by the user, so it's a good place to store authorization data.

        The \`auth.jwt()\` function is extremely versatile. For example, if you store some team data inside \`app_metadata\`, you can use it to determine whether a particular user belongs to a team. For example, if this was an array of IDs:

        \`\`\`sql
        create policy "User is in team"
        on my_table
        to authenticated
        using ( team_id in (select auth.jwt() -> 'app_metadata' -> 'teams'));
        \`\`\`

        ### MFA

        The \`auth.jwt()\` function can be used to check for [Multi-Factor Authentication](/docs/guides/auth/auth-mfa#enforce-rules-for-mfa-logins). For example, you could restrict a user from updating their profile unless they have at least 2 levels of authentication (Assurance Level 2):

        \`\`\`sql
        create policy "Restrict updates."
        on profiles
        as restrictive
        for update
        to authenticated using (
          (select auth.jwt()->>'aal') = 'aal2'
        );
        \`\`\`

        ## RLS performance recommendations

        Every authorization system has an impact on performance. While row level security is powerful, the performance impact is important to keep in mind. This is especially true for queries that scan every row in a table - like many \`select\` operations, including those using limit, offset, and ordering.

        Based on a series of [tests](https://github.com/GaryAustin1/RLS-Performance), we have a few recommendations for RLS:

        ### Add indexes

        Make sure you've added [indexes](/docs/guides/database/postgres/indexes) on any columns used within the Policies which are not already indexed (or primary keys). For a Policy like this:

        \`\`\`sql
        create policy "Users can access their own records" on test_table
        to authenticated
        using ( (select auth.uid()) = user_id );
        \`\`\`

        You can add an index like:

        \`\`\`sql
        create index userid
        on test_table
        using btree (user_id);
        \`\`\`

        ### Call functions with \`select\`

        You can use \`select\` statement to improve policies that use functions. For example, instead of this:

        \`\`\`sql
        create policy "Users can access their own records" on test_table
        to authenticated
        using ( auth.uid() = user_id );
        \`\`\`

        You can do:

        \`\`\`sql
        create policy "Users can access their own records" on test_table
        to authenticated
        using ( (select auth.uid()) = user_id );
        \`\`\`

        This method works well for JWT functions like \`auth.uid()\` and \`auth.jwt()\` as well as \`security definer\` Functions. Wrapping the function causes an \`initPlan\` to be run by the Postgres optimizer, which allows it to "cache" the results per-statement, rather than calling the function on each row.

        Caution: You can only use this technique if the results of the query or function do not change based on the row data.

        ### Minimize joins

        You can often rewrite your Policies to avoid joins between the source and the target table. Instead, try to organize your policy to fetch all the relevant data from the target table into an array or set, then you can use an \`IN\` or \`ANY\` operation in your filter.

        For example, this is an example of a slow policy which joins the source \`test_table\` to the target \`team_user\`:

        \`\`\`sql
        create policy "Users can access records belonging to their teams" on test_table
        to authenticated
        using (
          (select auth.uid()) in (
            select user_id
            from team_user
            where team_user.team_id = team_id -- joins to the source "test_table.team_id"
          )
        );
        \`\`\`

        We can rewrite this to avoid this join, and instead select the filter criteria into a set:

        \`\`\`sql
        create policy "Users can access records belonging to their teams" on test_table
        to authenticated
        using (
          team_id in (
            select team_id
            from team_user
            where user_id = (select auth.uid()) -- no join
          )
        );
        \`\`\`

        ### Specify roles in your policies

        Always use the Role of inside your policies, specified by the \`TO\` operator. For example, instead of this query:

        \`\`\`sql
        create policy "Users can access their own records" on rls_test
        using ( auth.uid() = user_id );
        \`\`\`

        Use:

        \`\`\`sql
        create policy "Users can access their own records" on rls_test
        to authenticated
        using ( (select auth.uid()) = user_id );
        \`\`\`

        This prevents the policy \`( (select auth.uid()) = user_id )\` from running for any \`anon\` users, since the execution stops at the \`to authenticated\` step.
      `,
    },
  ]

  if (entityDefinitions) {
    const definitions = codeBlock`${entityDefinitions.join('\n\n')}`
    initMessages.push({
      role: 'user',
      content: oneLine`Here is my database schema for reference: ${definitions}`,
    })
  }

  if (policyDefinition !== undefined) {
    const definitionBlock = codeBlock`${policyDefinition}`
    initMessages.push({
      role: 'user',
      content: codeBlock`
        Here is my policy definition for reference:
        ${definitionBlock}
      `.trim(),
    })
  }

  if (messages) {
    initMessages.push(...messages)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-05-13',
      messages: initMessages,
      max_tokens: 1024,
      temperature: 0,
      stream: true,
    })

    // Transform the streamed SSE response from OpenAI to a ReadableStream
    return OpenAIStream(response)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}
